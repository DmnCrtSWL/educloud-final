const express = require('express');
const router  = express.Router();
const pool    = require('../db');

// ─── Helper: generar ID EVA-XXXX ─────────────────────────────────────────────
async function generateEvaluacionId() {
  let id, exists = true;
  while (exists) {
    const rand = String(Math.floor(1000 + Math.random() * 9000));
    id = `EVA-${rand}`;
    const r = await pool.query('SELECT 1 FROM evaluaciones WHERE id = $1', [id]);
    exists = r.rowCount > 0;
  }
  return id;
}

// ─── GET /api/evaluaciones?grupo_id=... ──────────────────────────────────────
router.get('/', async (req, res) => {
  const { grupo_id } = req.query;
  if (!grupo_id) {
    return res.status(400).json({ ok: false, message: 'Se requiere grupo_id' });
  }
  try {
    const result = await pool.query(
      `SELECT e.*,
              COALESCE(json_agg(
                json_build_object(
                  'id', ec.id,
                  'nombre', ec.nombre,
                  'porcentaje', ec.porcentaje
                ) ORDER BY ec.id
              ) FILTER (WHERE ec.id IS NOT NULL), '[]') AS criterios
       FROM evaluaciones e
       LEFT JOIN evaluacion_criterios ec ON ec.evaluacion_id = e.id
       WHERE e.grupo_id = $1 AND e.deleted_at IS NULL
       GROUP BY e.id
       ORDER BY e.created_at DESC`,
      [grupo_id]
    );
    res.json({ ok: true, data: result.rows });
  } catch (err) {
    console.error('Error al listar evaluaciones:', err);
    res.status(500).json({ ok: false, message: 'Error interno del servidor' });
  }
});

// ─── GET /api/evaluaciones/:id ───────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT e.*,
              COALESCE(json_agg(
                json_build_object(
                  'id', ec.id,
                  'nombre', ec.nombre,
                  'porcentaje', ec.porcentaje
                ) ORDER BY ec.id
              ) FILTER (WHERE ec.id IS NOT NULL), '[]') AS criterios
       FROM evaluaciones e
       LEFT JOIN evaluacion_criterios ec ON ec.evaluacion_id = e.id
       WHERE e.id = $1 AND e.deleted_at IS NULL
       GROUP BY e.id`,
      [req.params.id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ ok: false, message: 'Evaluación no encontrada' });
    }
    res.json({ ok: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error interno del servidor' });
  }
});

// ─── POST /api/evaluaciones ───────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { grupo_id, nombre, descripcion, tipo, ponderacion_mes, fecha_inicio, fecha_entrega, criterios } = req.body;

  // Validaciones básicas
  if (!grupo_id || !nombre || !tipo || !fecha_inicio || !fecha_entrega) {
    return res.status(400).json({ ok: false, message: 'Faltan campos requeridos: grupo_id, nombre, tipo, fecha_inicio, fecha_entrega' });
  }
  if (!['Tarea', 'Trabajo en Clase', 'Examen'].includes(tipo)) {
    return res.status(400).json({ ok: false, message: 'Tipo inválido' });
  }
  if (!Array.isArray(criterios) || criterios.length === 0) {
    return res.status(400).json({ ok: false, message: 'Se requiere al menos un criterio' });
  }
  const totalPct = criterios.reduce((acc, c) => acc + Number(c.porcentaje || 0), 0);
  if (totalPct !== 100) {
    return res.status(400).json({ ok: false, message: `La suma de criterios debe ser 100%. Actualmente: ${totalPct}%` });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const id = await generateEvaluacionId();

    // Insertar evaluación
    const evalResult = await client.query(
      `INSERT INTO evaluaciones (id, grupo_id, nombre, descripcion, tipo, ponderacion_mes, fecha_inicio, fecha_entrega)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        id,
        grupo_id,
        nombre.trim(),
        descripcion?.trim() || null,
        tipo,
        ponderacion_mes || null,
        fecha_inicio,
        fecha_entrega,
      ]
    );

    // Insertar criterios
    for (const c of criterios) {
      await client.query(
        `INSERT INTO evaluacion_criterios (evaluacion_id, nombre, porcentaje) VALUES ($1, $2, $3)`,
        [id, c.nombre.trim(), Number(c.porcentaje)]
      );
    }

    await client.query('COMMIT');

    // Devolver evaluación con criterios
    const full = await pool.query(
      `SELECT e.*,
              COALESCE(json_agg(
                json_build_object('id', ec.id, 'nombre', ec.nombre, 'porcentaje', ec.porcentaje)
                ORDER BY ec.id
              ) FILTER (WHERE ec.id IS NOT NULL), '[]') AS criterios
       FROM evaluaciones e
       LEFT JOIN evaluacion_criterios ec ON ec.evaluacion_id = e.id
       WHERE e.id = $1
       GROUP BY e.id`,
      [id]
    );

    res.status(201).json({ ok: true, data: full.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error al crear evaluación:', err);
    res.status(500).json({ ok: false, message: err.message || 'Error interno del servidor' });
  } finally {
    client.release();
  }
});

// ─── PUT /api/evaluaciones/:id ───────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  const { nombre, descripcion, tipo, ponderacion_mes, fecha_inicio, fecha_entrega, criterios } = req.body;

  if (!nombre || !tipo || !fecha_inicio || !fecha_entrega) {
    return res.status(400).json({ ok: false, message: 'Faltan campos requeridos' });
  }
  if (!['Tarea', 'Trabajo en Clase', 'Examen'].includes(tipo)) {
    return res.status(400).json({ ok: false, message: 'Tipo inválido' });
  }
  if (Array.isArray(criterios)) {
    const total = criterios.reduce((acc, c) => acc + Number(c.porcentaje || 0), 0);
    if (total !== 100) {
      return res.status(400).json({ ok: false, message: `La suma de criterios debe ser 100%. Actualmente: ${total}%` });
    }
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const updateResult = await client.query(
      `UPDATE evaluaciones
       SET nombre=$1, descripcion=$2, tipo=$3, ponderacion_mes=$4, fecha_inicio=$5, fecha_entrega=$6
       WHERE id=$7 AND deleted_at IS NULL
       RETURNING id`,
      [nombre.trim(), descripcion?.trim() || null, tipo, ponderacion_mes || null, fecha_inicio, fecha_entrega, req.params.id]
    );

    if (updateResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ ok: false, message: 'Evaluación no encontrada' });
    }

    // Reemplazar criterios si se enviaron
    if (Array.isArray(criterios)) {
      await client.query('DELETE FROM evaluacion_criterios WHERE evaluacion_id = $1', [req.params.id]);
      for (const c of criterios) {
        await client.query(
          'INSERT INTO evaluacion_criterios (evaluacion_id, nombre, porcentaje) VALUES ($1, $2, $3)',
          [req.params.id, c.nombre.trim(), Number(c.porcentaje)]
        );
      }
    }

    await client.query('COMMIT');

    // Devolver evaluación actualizada con criterios
    const full = await pool.query(
      `SELECT e.*,
              COALESCE(json_agg(
                json_build_object('id', ec.id, 'nombre', ec.nombre, 'porcentaje', ec.porcentaje)
                ORDER BY ec.id
              ) FILTER (WHERE ec.id IS NOT NULL), '[]') AS criterios
       FROM evaluaciones e
       LEFT JOIN evaluacion_criterios ec ON ec.evaluacion_id = e.id
       WHERE e.id = $1
       GROUP BY e.id`,
      [req.params.id]
    );

    res.json({ ok: true, data: full.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error al actualizar evaluación:', err);
    res.status(500).json({ ok: false, message: err.message || 'Error interno del servidor' });
  } finally {
    client.release();
  }
});

// ─── DELETE /api/evaluaciones/:id  (soft delete) ──────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE evaluaciones SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING id`,
      [req.params.id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ ok: false, message: 'Evaluación no encontrada' });
    }
    res.json({ ok: true, message: 'Evaluación eliminada' });
  } catch (err) {
    console.error('Error al eliminar evaluación:', err);
    res.status(500).json({ ok: false, message: 'Error interno del servidor' });
  }
});

module.exports = router;
