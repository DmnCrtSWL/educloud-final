const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcryptjs');
const { verifyToken } = require('../middleware/auth');

// ─── Helper: genera EDU-XXX-XXX único ────────────────────────────────────────
async function generateUniqueId() {
  let id;
  let exists = true;

  while (exists) {
    const p1 = String(Math.floor(Math.random() * 900) + 100);
    const p2 = String(Math.floor(Math.random() * 900) + 100);
    id = `EDU-${p1}-${p2}`;

    const result = await pool.query('SELECT 1 FROM alumnos WHERE id = $1', [id]);
    exists = result.rowCount > 0;
  }

  return id;
}

// ─── GET /api/alumnos ─────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  const { q } = req.query;
  try {
    let query, params;
    if (q) {
      const like = `%${q}%`;
      query = `SELECT a.id, a.nombre, a.curp, a.notas_importancia, a.tutores, a.created_at, a.updated_at, a.estatus,
                      g.grado AS grupo_grado, g.grupo AS grupo_letra
               FROM alumnos a
               LEFT JOIN LATERAL (
                 SELECT grupo_id 
                 FROM grupo_alumnos 
                 WHERE alumno_id = a.id 
                 ORDER BY enrolled_at DESC 
                 LIMIT 1
               ) ga ON true
               LEFT JOIN grupos g ON g.id = ga.grupo_id
               WHERE a.deleted_at IS NULL
                 AND (a.nombre ILIKE $1 OR a.curp ILIKE $1 OR a.id ILIKE $1)
               ORDER BY a.nombre ASC
               LIMIT 30`;
      params = [like];
    } else {
      query = `SELECT a.id, a.nombre, a.curp, a.notas_importancia, a.tutores, a.created_at, a.updated_at, a.estatus,
                      g.grado AS grupo_grado, g.grupo AS grupo_letra
               FROM alumnos a
               LEFT JOIN LATERAL (
                 SELECT grupo_id 
                 FROM grupo_alumnos 
                 WHERE alumno_id = a.id 
                 ORDER BY enrolled_at DESC 
                 LIMIT 1
               ) ga ON true
               LEFT JOIN grupos g ON g.id = ga.grupo_id
               WHERE a.deleted_at IS NULL
               ORDER BY split_part(a.nombre, ' ', 1) ASC, a.nombre ASC`;
      params = [];
    }
    const result = await pool.query(query, params);
    const data = result.rows.map((row, i) => ({ ...row, num_lista: i + 1 }));
    res.json({ ok: true, data });
  } catch (error) {
    console.error('Error al listar alumnos:', error);
    res.status(500).json({ ok: false, message: 'Error interno del servidor' });
  }
});

// ─── GET /api/alumnos/:id ─────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT a.id, a.nombre, a.curp, a.notas_importancia, a.tutores, a.created_at, a.updated_at, a.estatus,
              g.grado AS grupo_grado, g.grupo AS grupo_letra, g.id AS grupo_id
       FROM alumnos a
       LEFT JOIN grupo_alumnos ga ON ga.alumno_id = a.id
       LEFT JOIN grupos g ON g.id = ga.grupo_id
       WHERE a.id = $1 AND a.deleted_at IS NULL`,
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ ok: false, message: 'Alumno no encontrado' });
    }
    res.json({ ok: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error al obtener alumno:', error);
    res.status(500).json({ ok: false, message: 'Error interno del servidor' });
  }
});

// ─── PUT /api/alumnos/:id ─────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, curp, notas_importancia, tutores } = req.body;

  try {
    // If nombre and curp are provided, it's a basic info update (from the modal)
    if (nombre && curp) {
        const curpUpper = curp.toUpperCase().trim();
        if (curpUpper.length !== 18) {
          return res.status(400).json({ ok: false, message: 'La CURP debe tener exactamente 18 caracteres' });
        }
        
        // Verificar CURP duplicada
        const dup = await pool.query('SELECT 1 FROM alumnos WHERE curp = $1 AND id != $2 AND deleted_at IS NULL', [curpUpper, id]);
        if (dup.rowCount > 0) {
          return res.status(409).json({ ok: false, message: 'Ya existe otro alumno con esa CURP' });
        }

        const result = await pool.query(
          `UPDATE alumnos
           SET nombre = $1, curp = $2, updated_at = NOW()
           WHERE id = $3 AND deleted_at IS NULL
           RETURNING id, nombre, curp, notas_importancia, tutores, created_at, updated_at, estatus`,
          [nombre.trim(), curpUpper, id]
        );
        if (result.rowCount === 0) {
          return res.status(404).json({ ok: false, message: 'Alumno no encontrado' });
        }
        return res.json({ ok: true, data: result.rows[0] });
    }

    // Original update for profile
    const result = await pool.query(
      `UPDATE alumnos
       SET notas_importancia = $1,
           tutores = $2::jsonb,
           updated_at = NOW()
       WHERE id = $3 AND deleted_at IS NULL
       RETURNING id, nombre, curp, notas_importancia, tutores, created_at, updated_at, estatus`,
      [notas_importancia ?? null, JSON.stringify(tutores ?? []), id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ ok: false, message: 'Alumno no encontrado' });
    }
    res.json({ ok: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error al actualizar alumno:', error);
    res.status(500).json({ ok: false, message: 'Error interno del servidor' });
  }
});



// ─── POST /api/alumnos ────────────────────────────────────────────────────────
// Crea un alumno. Genera ID único EDU-XXX-XXX.
router.post('/', async (req, res) => {
  const { nombre, curp } = req.body;

  if (!nombre || !curp) {
    return res.status(400).json({ ok: false, message: 'Los campos nombre y curp son obligatorios' });
  }

  const curpUpper = curp.toUpperCase().trim();
  if (curpUpper.length !== 18) {
    return res.status(400).json({ ok: false, message: 'La CURP debe tener exactamente 18 caracteres' });
  }

  try {
    // Verificar CURP duplicada
    const dup = await pool.query('SELECT 1 FROM alumnos WHERE curp = $1', [curpUpper]);
    if (dup.rowCount > 0) {
      return res.status(409).json({ ok: false, message: 'Ya existe un alumno con esa CURP' });
    }

    const id = await generateUniqueId();

    const result = await pool.query(
      `INSERT INTO alumnos (id, nombre, curp)
       VALUES ($1, $2, $3)
       RETURNING id, nombre, curp, created_at, updated_at`,
      [id, nombre.trim(), curpUpper]
    );

    res.status(201).json({ ok: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error al crear alumno:', error);
    res.status(500).json({ ok: false, message: 'Error interno del servidor' });
  }
});

// ─── DELETE /api/alumnos/:id ──────────────────────────────────────────────────
// Soft delete
router.delete('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE alumnos SET deleted_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING id`,
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ ok: false, message: 'Alumno no encontrado o ya eliminado' });
    }
    
    // Also remove from any enrolled group natively
    await pool.query('DELETE FROM grupo_alumnos WHERE alumno_id = $1', [id]);

    res.json({ ok: true, message: 'Alumno eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar alumno:', error);
    res.status(500).json({ ok: false, message: 'Error interno del servidor' });
  }
});

// ─── POST /api/alumnos/:id/dar-baja ───────────────────────────────────────────
// Soft delete con confirmación de password del usuario activo
router.post('/:id/dar-baja', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;
  
  if (!password) {
    return res.status(400).json({ ok: false, message: 'La contraseña es requerida' });
  }

  try {
    const userResult = await pool.query('SELECT password FROM usuarios WHERE id = $1 AND deleted_at IS NULL', [req.user.id]);
    if (userResult.rowCount === 0) return res.status(401).json({ ok: false, message: 'Usuario activo no encontrado' });

    const valid = await bcrypt.compare(password, userResult.rows[0].password);
    if (!valid) return res.status(401).json({ ok: false, message: 'Contraseña incorrecta' });

    const result = await pool.query(
      `UPDATE alumnos SET estatus = 'Baja'
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING id`,
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ ok: false, message: 'Alumno no encontrado o ya eliminado' });
    }
    
    // Also remove from any enrolled group natively
    await pool.query('DELETE FROM grupo_alumnos WHERE alumno_id = $1', [id]);

    res.json({ ok: true, message: 'Alumno dado de baja correctamente' });
  } catch (error) {
    console.error('Error al dar de baja alumno:', error);
    res.status(500).json({ ok: false, message: 'Error interno del servidor' });
  }
});

module.exports = router;
