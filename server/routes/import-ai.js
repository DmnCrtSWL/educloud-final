const express = require('express');
const router = express.Router();
const multer = require('multer');
const { OpenAI } = require('openai');
const pdfParse = require('pdf-parse');
const XLSX = require('xlsx');
const mammoth = require('mammoth');
const pool = require('../db');

// ─── Setup ───────────────────────────────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024, files: 10 },
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── Sistema prompt ───────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `Eres un asistente experto en extracción de datos escolares mexicanos.
Tu tarea es analizar el documento adjunto y extraer la lista COMPLETA de todos los alumnos sin excepción.

PASOS OBLIGATORIOS:
1. Primero cuenta cuántas filas/renglones con alumnos hay en el documento.
2. Luego extrae CADA UNO de ellos. No omitas ninguno. Si hay 18 alumnos en la imagen, debes devolver 18 objetos.
3. Si el documento tiene numeración (1, 2, 3...), úsala para asegurarte de no saltar ningún renglón.

Para cada alumno extrae:
- nombre: Nombre completo en formato "Apellido_Paterno Apellido_Materno Nombre(s)". Si las columnas están separadas, combínalas en ese orden.
- curp: El código CURP alfanumérico de entre 16 y 18 caracteres visible en el documento. Cópialo exactamente como aparece, sin espacios. Si no está visible usa null.

Reglas:
- Ignora columnas de edad, grado, grupo, fecha, asistencia u otras.
- Ignora encabezados, pies de página, nombre del profesor o datos del plantel.
- Si hay múltiples páginas u hojas, extrae de todas.
- NO dejes de incluir ningún alumno aunque la imagen sea difícil de leer. Haz tu mejor esfuerzo.

Responde ÚNICAMENTE con JSON válido sin texto adicional:
{
  "alumnos": [
    { "nombre": "García Pérez Ana", "curp": "GAPA120514MDFRRN01" },
    { "nombre": "López Silva Carlos", "curp": null }
  ],
  "total_detectado": 18,
  "nota": "Texto breve (opcional)"
}

Si no encuentras alumnos: { "alumnos": [], "total_detectado": 0, "nota": "motivo" }`;

// ─── Helper: ID único EDU-XXX-XXX ─────────────────────────────────────────────
async function generateUniqueId() {
  let id, exists = true;
  while (exists) {
    const p1 = String(Math.floor(Math.random() * 900) + 100);
    const p2 = String(Math.floor(Math.random() * 900) + 100);
    id = `EDU-${p1}-${p2}`;
    const r = await pool.query('SELECT 1 FROM alumnos WHERE id = $1', [id]);
    exists = r.rowCount > 0;
  }
  return id;
}

// ─── Helper: extraer contenido por tipo de archivo ────────────────────────────
async function extractContent(file) {
  const mime = file.mimetype;
  const name = file.originalname.toLowerCase();

  // ── Imágenes → base64 para GPT-4o Vision ──────────────────────────────────
  if (mime.startsWith('image/')) {
    const b64 = file.buffer.toString('base64');
    // Normalizar HEIC → jpeg para la API (tratarlo como jpeg, GPT-4o suele aceptarlo)
    const mimeType = mime === 'image/heic' || mime === 'image/heif' ? 'image/jpeg' : mime;
    return {
      type: 'image',
      content: `data:${mimeType};base64,${b64}`,
    };
  }

  // ── PDF → texto plano ──────────────────────────────────────────────────────
  if (mime === 'application/pdf' || name.endsWith('.pdf')) {
    const data = await pdfParse(file.buffer);
    return { type: 'text', content: data.text, label: file.originalname };
  }

  // ── Excel → texto tabular ──────────────────────────────────────────────────
  if (
    name.endsWith('.xlsx') || name.endsWith('.xls') ||
    mime.includes('spreadsheetml') || mime.includes('ms-excel')
  ) {
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    let text = '';
    workbook.SheetNames.forEach((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      text += `\n--- Hoja: ${sheetName} ---\n`;
      text += XLSX.utils.sheet_to_csv(sheet);
    });
    return { type: 'text', content: text, label: file.originalname };
  }

  // ── CSV → texto plano ──────────────────────────────────────────────────────
  if (name.endsWith('.csv') || mime === 'text/csv') {
    return {
      type: 'text',
      content: file.buffer.toString('utf-8'),
      label: file.originalname,
    };
  }

  // ── Word .docx → texto ────────────────────────────────────────────────────
  if (
    name.endsWith('.docx') ||
    mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return { type: 'text', content: result.value, label: file.originalname };
  }

  // ── Word .doc → intentar como texto ───────────────────────────────────────
  if (name.endsWith('.doc') || mime === 'application/msword') {
    try {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      return { type: 'text', content: result.value, label: file.originalname };
    } catch {
      return { type: 'text', content: file.buffer.toString('utf-8', 0, 4000), label: file.originalname };
    }
  }

  // ── Fallback: texto plano ─────────────────────────────────────────────────
  return {
    type: 'text',
    content: file.buffer.toString('utf-8'),
    label: file.originalname,
  };
}

// ─── POST /api/alumnos/import-ai ──────────────────────────────────────────────
router.post('/import-ai', upload.array('files', 10), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ ok: false, message: 'No se recibieron archivos' });
  }

  try {
    // 1. Extraer contenido de cada archivo
    const contents = await Promise.all(req.files.map(extractContent));

    // 2. Construir el mensaje para GPT-4o
    // Mezclamos texto e imágenes en un solo mensaje "user"
    const userParts = [];

    contents.forEach((c, i) => {
      if (c.type === 'image') {
        userParts.push({
          type: 'image_url',
          image_url: { url: c.content, detail: 'high' },
        });
      } else {
        userParts.push({
          type: 'text',
          text: `Archivo ${i + 1} (${c.label || 'documento'}):\n${c.content.slice(0, 12000)}`,
        });
      }
    });

    userParts.unshift({
      type: 'text',
      text: 'Analiza el/los siguiente(s) archivo(s) y extrae la lista de alumnos:',
    });

    // 3. Llamar a GPT-4o
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userParts },
      ],
      max_tokens: 4096,
      temperature: 0.1,
    });

    // 4. Parsear respuesta
    const raw = completion.choices[0].message.content || '{}';
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return res.status(500).json({ ok: false, message: 'La IA devolvió un formato inesperado', raw });
    }

    const alumnosExtraidos = Array.isArray(parsed.alumnos) ? parsed.alumnos : [];
    if (alumnosExtraidos.length === 0) {
      return res.json({
        ok: true,
        insertados: [],
        omitidos: [],
        nota: parsed.nota || 'No se encontraron alumnos en los archivos',
      });
    }

    // 5. Insertar en la BD (saltando duplicados de CURP)
    const insertados = [];
    const omitidos = [];

    for (const a of alumnosExtraidos) {
      if (!a.nombre || !a.nombre.trim()) { omitidos.push({ ...a, razon: 'Nombre vacío' }); continue; }

      try {
        // Verificar CURP duplicada si viene
        const curpPreview = a.curp ? String(a.curp).toUpperCase().replace(/\s/g, '') : null;
        if (curpPreview && curpPreview.length >= 16) {
          const dup = await pool.query(
            'SELECT nombre FROM alumnos WHERE curp = $1',
            [curpPreview]
          );
          if (dup.rowCount > 0) {
            omitidos.push({ ...a, razon: `CURP ya registrada (${dup.rows[0].nombre})` });
            continue;
          }
        }

        const id = await generateUniqueId();
        // Limpiar CURP: quitar espacios, convertir a mayúsculas
        const curpLimpia = a.curp ? String(a.curp).toUpperCase().replace(/\s/g, '') : null;
        // Aceptar CURPs de 16-19 chars (OCR de imagen puede leer uno de más/menos)
        const curpFinal = curpLimpia && curpLimpia.length >= 16 && curpLimpia.length <= 19 ? curpLimpia : null;

        // CURP es requerida en la tabla
        if (!curpFinal) {
          omitidos.push({ ...a, razon: `CURP inválida o ausente ("${a.curp || 'null'}")` });
          continue;
        }

        const result = await pool.query(
          `INSERT INTO alumnos (id, nombre, curp)
           VALUES ($1, $2, $3)
           RETURNING id, nombre, curp`,
          [id, a.nombre.trim(), curpFinal]
        );
        insertados.push(result.rows[0]);
      } catch (err) {
        omitidos.push({ ...a, razon: err.message });
      }
    }

    res.json({
      ok: true,
      insertados,
      omitidos,
      nota: parsed.nota || null,
    });
  } catch (error) {
    console.error('Error en import-ai:', error);
    res.status(500).json({ ok: false, message: error.message || 'Error interno del servidor' });
  }
});

module.exports = router;
