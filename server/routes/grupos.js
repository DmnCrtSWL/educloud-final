const express = require('express');
const router  = express.Router();
const pool    = require('../db');

// ─── Helper: generar ID GRP-XXXX ─────────────────────────────────────────────
async function generateGrupoId() {
  let id, exists = true;
  while (exists) {
    const rand = String(Math.floor(1000 + Math.random() * 9000));
    id = `GRP-${rand}`;
    const r = await pool.query('SELECT 1 FROM grupos WHERE id = $1', [id]);
    exists = r.rowCount > 0;
  }
  return id;
}

// ─── Helper: generar ID MAT-XXXX ──────────────────────────────────────────────
async function generateMateriaId() {
  let id, exists = true;
  while (exists) {
    const rand = String(Math.floor(1000 + Math.random() * 9000));
    id = `MAT-${rand}`;
    const r = await pool.query('SELECT 1 FROM grupo_materias WHERE id = $1', [id]);
    exists = r.rowCount > 0;
  }
  return id;
}

// ─── GET /api/grupos ──────────────────────────────────────────────────────────
// Devuelve todos los grupos con sus materias embebidas y conteo de alumnos
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT g.id, g.grado, g.grupo, g.turno, g.created_at,
              COUNT(DISTINCT ga.alumno_id) AS total_alumnos,
              COALESCE(
                json_agg(
                  json_build_object(
                    'id', gm.id,
                    'nombre', gm.nombre,
                    'horario', gm.horario,
                    'docente_id', gm.docente_id,
                    'docente_nombre', gm.docente_nombre
                  ) ORDER BY gm.nombre
                ) FILTER (WHERE gm.id IS NOT NULL),
                '[]'
              ) AS materias
       FROM grupos g
       LEFT JOIN grupo_alumnos ga ON ga.grupo_id = g.id
       LEFT JOIN grupo_materias gm ON gm.grupo_id = g.id
       GROUP BY g.id
       ORDER BY g.grado ASC, g.grupo ASC`
    );
    res.json({ ok: true, data: result.rows });
  } catch (err) {
    console.error('Error al listar grupos:', err);
    res.status(500).json({ ok: false, message: 'Error interno del servidor' });
  }
});

// ─── POST /api/grupos ─────────────────────────────────────────────────────────
// Body: { grado, grupo, turno, alumno_ids? }
router.post('/', async (req, res) => {
  const { grado, grupo, turno, alumno_ids } = req.body;

  if (!grado || !grupo || !turno) {
    return res.status(400).json({ ok: false, message: 'Grado, grupo y turno son requeridos' });
  }
  if (![1, 2, 3].includes(Number(grado))) {
    return res.status(400).json({ ok: false, message: 'Grado inválido (1, 2 o 3)' });
  }

  try {
    // Verificar duplicado
    const dup = await pool.query(
      'SELECT id FROM grupos WHERE grado=$1 AND grupo=$2 AND turno=$3',
      [grado, grupo, turno]
    );
    if (dup.rowCount > 0) {
      return res.status(409).json({
        ok: false,
        message: `Ya existe el grupo ${grado}°${grupo} turno ${turno}`
      });
    }

    const id = await generateGrupoId();
    const result = await pool.query(
      `INSERT INTO grupos (id, grado, grupo, turno) VALUES ($1,$2,$3,$4) RETURNING *`,
      [id, Number(grado), grupo, turno]
    );

    // Enrolar alumnos si se enviaron
    if (Array.isArray(alumno_ids) && alumno_ids.length > 0) {
      const values = alumno_ids.map((aid, i) => `($1, $${i + 2})`).join(', ');
      await pool.query(
        `INSERT INTO grupo_alumnos (grupo_id, alumno_id) VALUES ${values} 
         ON CONFLICT (alumno_id) DO UPDATE SET grupo_id = EXCLUDED.grupo_id, enrolled_at = NOW()`,
        [id, ...alumno_ids]
      );
    }

    res.status(201).json({ ok: true, data: { ...result.rows[0], materias: [], total_alumnos: alumno_ids?.length ?? 0 } });
  } catch (err) {
    console.error('Error al crear grupo:', err);
    res.status(500).json({ ok: false, message: err.message || 'Error interno del servidor' });
  }
});

// ─── GET /api/grupos/:id ──────────────────────────────────────────────────────
// Devuelve el grupo + sus materias + sus alumnos enrolados
router.get('/:id', async (req, res) => {
  try {
    const grupoRes = await pool.query('SELECT * FROM grupos WHERE id = $1', [req.params.id]);
    if (grupoRes.rowCount === 0) return res.status(404).json({ ok: false, message: 'Grupo no encontrado' });

    const grupo = grupoRes.rows[0];

    const materiasRes = await pool.query(
      `SELECT id, nombre, horario, docente_id, docente_nombre, created_at
       FROM grupo_materias WHERE grupo_id = $1 ORDER BY nombre`,
      [req.params.id]
    );

    const alumnosRes = await pool.query(
      `SELECT a.id, a.nombre, a.curp, a.created_at
       FROM grupo_alumnos ga
       JOIN alumnos a ON a.id = ga.alumno_id
       WHERE ga.grupo_id = $1 AND a.deleted_at IS NULL
       ORDER BY a.nombre`,
      [req.params.id]
    );

    res.json({
      ok: true,
      data: {
        ...grupo,
        materias: materiasRes.rows,
        alumnos: alumnosRes.rows,
      }
    });
  } catch (err) {
    console.error("GET /api/grupos/:id Error:", err);
    res.status(500).json({ ok: false, message: 'Error interno del servidor' });
  }
});

// ─── POST /api/grupos/:id/materias ────────────────────────────────────────────
// Body: { nombre, horario, docente_id, docente_nombre }
router.post('/:id/materias', async (req, res) => {
  const { nombre, horario, docente_id, docente_nombre } = req.body;
  if (!nombre || !docente_id || !docente_nombre) {
    return res.status(400).json({ ok: false, message: 'nombre, docente_id y docente_nombre son requeridos' });
  }

  try {
    const g = await pool.query('SELECT id FROM grupos WHERE id = $1', [req.params.id]);
    if (g.rowCount === 0) return res.status(404).json({ ok: false, message: 'Grupo no encontrado' });

    // Evitar duplicado de materia en el mismo grupo
    const dup = await pool.query(
      'SELECT id FROM grupo_materias WHERE grupo_id=$1 AND nombre=$2',
      [req.params.id, nombre.trim()]
    );
    if (dup.rowCount > 0) {
      return res.status(409).json({ ok: false, message: `La materia "${nombre}" ya está en este grupo` });
    }

    const id = await generateMateriaId();
    const result = await pool.query(
      `INSERT INTO grupo_materias (id, grupo_id, nombre, horario, docente_id, docente_nombre)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [id, req.params.id, nombre.trim(), horario || null, docente_id, docente_nombre]
    );

    res.status(201).json({ ok: true, data: result.rows[0] });
  } catch (err) {
    console.error('Error al agregar materia:', err);
    res.status(500).json({ ok: false, message: err.message });
  }
});

// ─── DELETE /api/grupos/:grupoId/materias/:materiaId ──────────────────────────
router.delete('/:grupoId/materias/:materiaId', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM grupo_materias WHERE id=$1 AND grupo_id=$2',
      [req.params.materiaId, req.params.grupoId]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// ─── GET /api/grupos/:id/alumnos-elegibles ────────────────────────────────────
router.get('/:id/alumnos-elegibles', async (req, res) => {
  try {
    const grupoRes = await pool.query('SELECT * FROM grupos WHERE id = $1', [req.params.id]);
    if (grupoRes.rowCount === 0) return res.status(404).json({ ok: false, message: 'Grupo no encontrado' });

    const grupo = grupoRes.rows[0];
    const rangoNacimiento = {
      1: { min: 2013, max: 2014 },
      2: { min: 2012, max: 2013 },
      3: { min: 2011, max: 2012 },
    }[grupo.grado];

    if (!rangoNacimiento) return res.status(400).json({ ok: false, message: 'Grado inválido' });

    const result = await pool.query(
      `SELECT a.id, a.nombre, a.curp, a.created_at,
              false AS enrolado
       FROM alumnos a
       LEFT JOIN grupo_alumnos ga ON ga.alumno_id = a.id
       WHERE a.deleted_at IS NULL
         AND ga.grupo_id IS NULL
         AND length(a.curp) >= 16
         AND (
           CASE
             WHEN CAST(SUBSTRING(a.curp, 5, 2) AS INT) <= 26
               THEN 2000 + CAST(SUBSTRING(a.curp, 5, 2) AS INT)
             ELSE
               1900 + CAST(SUBSTRING(a.curp, 5, 2) AS INT)
           END
         ) BETWEEN $1 AND $2
       ORDER BY a.nombre ASC`,
      [rangoNacimiento.min, rangoNacimiento.max]
    );

    const enrolledRes = await pool.query(
      `SELECT a.id, a.nombre, a.curp, a.created_at, true AS enrolado
       FROM grupo_alumnos ga
       JOIN alumnos a ON a.id = ga.alumno_id
       WHERE ga.grupo_id = $1 AND a.deleted_at IS NULL
       ORDER BY a.nombre ASC`,
      [req.params.id]
    );

    res.json({
      ok: true,
      grupo,
      data: result.rows,
      enrolled: enrolledRes.rows,
      rango: rangoNacimiento
    });
  } catch (err) {
    console.error('Error alumnos-elegibles:', err);
    res.status(500).json({ ok: false, message: err.message });
  }
});

// ─── GET /api/grupos/:id/enrolados ────────────────────────────────────────────
router.get('/:id/enrolados', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.id, a.nombre, a.curp, a.created_at,
              g.grado AS grupo_grado, g.grupo AS grupo_letra
       FROM grupo_alumnos ga
       JOIN alumnos a ON a.id = ga.alumno_id
       JOIN grupos g ON g.id = ga.grupo_id
       WHERE ga.grupo_id = $1 AND a.deleted_at IS NULL
       ORDER BY split_part(a.nombre, ' ', 1) ASC, a.nombre ASC`,
      [req.params.id]
    );
    res.json({ ok: true, data: result.rows });
  } catch (err) {
    console.error('Error al obtener enrolados:', err);
    res.status(500).json({ ok: false, message: err.message });
  }
});

// ─── POST /api/grupos/:id/enrolar ─────────────────────────────────────────────
router.post('/:id/enrolar', async (req, res) => {
  const { alumno_ids } = req.body;
  if (!Array.isArray(alumno_ids) || alumno_ids.length === 0) {
    return res.status(400).json({ ok: false, message: 'Se requiere un arreglo alumno_ids' });
  }
  try {
    const g = await pool.query('SELECT id FROM grupos WHERE id = $1', [req.params.id]);
    if (g.rowCount === 0) return res.status(404).json({ ok: false, message: 'Grupo no encontrado' });

    const values = alumno_ids.map((aid, i) => `($1, $${i + 2})`).join(', ');
    await pool.query(
      `INSERT INTO grupo_alumnos (grupo_id, alumno_id) VALUES ${values} 
       ON CONFLICT (alumno_id) DO UPDATE SET grupo_id = EXCLUDED.grupo_id, enrolled_at = NOW()`,
      [req.params.id, ...alumno_ids]
    );
    res.json({ ok: true, message: `${alumno_ids.length} alumno(s) enrolado(s)` });
  } catch (err) {
    console.error('Error al enrolar:', err);
    res.status(500).json({ ok: false, message: err.message });
  }
});

// ─── DELETE /api/grupos/:id/desenrolar/:alumnoId ──────────────────────────────
router.delete('/:id/desenrolar/:alumnoId', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM grupo_alumnos WHERE grupo_id = $1 AND alumno_id = $2',
      [req.params.id, req.params.alumnoId]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// ─── DELETE /api/grupos/:id ───────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM grupos WHERE id=$1 RETURNING id', [req.params.id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ ok: false, message: 'Grupo no encontrado' });
    }
    res.json({ ok: true, message: 'Grupo eliminado' });
  } catch (err) {
    console.error('Error al eliminar grupo:', err);
    res.status(500).json({ ok: false, message: 'Error interno del servidor' });
  }
});

module.exports = router;
