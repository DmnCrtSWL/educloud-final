const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcryptjs');

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Genera un ID único con formato XXX-XXX-XXX (9 dígitos en 3 bloques de 3).
 * Verifica unicidad contra la BD antes de retornar.
 */
async function generateUniqueId() {
  let id;
  let exists = true;

  while (exists) {
    const p1 = String(Math.floor(Math.random() * 900) + 100);
    const p2 = String(Math.floor(Math.random() * 900) + 100);
    const p3 = String(Math.floor(Math.random() * 900) + 100);
    id = `${p1}-${p2}-${p3}`;

    const result = await pool.query('SELECT 1 FROM usuarios WHERE id = $1', [id]);
    exists = result.rowCount > 0;
  }

  return id;
}

// ─── GET /api/usuarios ───────────────────────────────────────────────────────
// Lista todos los usuarios activos (donde deleted_at IS NULL).
// Nunca retorna el campo password.
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, nombre, rol, correo, created_at, updated_at, deleted_at
       FROM usuarios
       WHERE deleted_at IS NULL
       ORDER BY created_at DESC`
    );
    res.json({ ok: true, data: result.rows });
  } catch (error) {
    console.error('Error al listar usuarios:', error);
    res.status(500).json({ ok: false, message: 'Error interno del servidor' });
  }
});

// ─── POST /api/usuarios ──────────────────────────────────────────────────────
// Crea un nuevo usuario. Valida campos, genera ID único, encripta contraseña.
router.post('/', async (req, res) => {
  const { nombre, rol, correo, password } = req.body;

  // Validación de campos obligatorios
  if (!nombre || !rol || !correo || !password) {
    return res.status(400).json({
      ok: false,
      message: 'Todos los campos son obligatorios: nombre, rol, correo, password',
    });
  }

  // Validación del ENUM de roles
  const rolesValidos = ['Docente', 'Directivo', 'Administrativo', 'Prefectura', 'Trabajo Social', 'Sistemas'];
  if (!rolesValidos.includes(rol)) {
    return res.status(400).json({
      ok: false,
      message: `Rol inválido. Valores permitidos: ${rolesValidos.join(', ')}`,
    });
  }

  try {
    // Verificar si el correo ya existe
    const existingUser = await pool.query('SELECT 1 FROM usuarios WHERE correo = $1', [correo]);
    if (existingUser.rowCount > 0) {
      return res.status(409).json({ ok: false, message: 'Ya existe un usuario con ese correo electrónico' });
    }

    // Generar ID único
    const id = await generateUniqueId();

    // Encriptar contraseña con bcrypt (10 rondas de salt)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar en BD
    const result = await pool.query(
      `INSERT INTO usuarios (id, nombre, rol, correo, password)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nombre, rol, correo, created_at, updated_at, deleted_at`,
      [id, nombre, rol, correo, hashedPassword]
    );

    res.status(201).json({ ok: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ ok: false, message: 'Error interno del servidor' });
  }
});

// ─── GET /api/usuarios/:id ───────────────────────────────────────────────────
// Retorna un usuario por ID (sin password).
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT id, nombre, rol, correo, created_at, updated_at, deleted_at
       FROM usuarios
       WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ ok: false, message: 'Usuario no encontrado' });
    }
    res.json({ ok: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ ok: false, message: 'Error interno del servidor' });
  }
});

// ─── PUT /api/usuarios/:id ───────────────────────────────────────────────────
// Actualiza un usuario. Si se envía password, se hashea y reemplaza.
// Campos opcionales: si no se envían, se mantienen los actuales.
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, rol, correo, password } = req.body;

  const rolesValidos = ['Docente', 'Directivo', 'Administrativo', 'Prefectura', 'Trabajo Social', 'Sistemas'];

  if (rol && !rolesValidos.includes(rol)) {
    return res.status(400).json({
      ok: false,
      message: `Rol inválido. Valores permitidos: ${rolesValidos.join(', ')}`,
    });
  }

  try {
    // Verificar que el usuario existe
    const existing = await pool.query(
      'SELECT id, correo FROM usuarios WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );
    if (existing.rowCount === 0) {
      return res.status(404).json({ ok: false, message: 'Usuario no encontrado' });
    }

    // Verificar correo duplicado en otro usuario
    if (correo && correo !== existing.rows[0].correo) {
      const dupCheck = await pool.query(
        'SELECT 1 FROM usuarios WHERE correo = $1 AND id != $2',
        [correo, id]
      );
      if (dupCheck.rowCount > 0) {
        return res.status(409).json({ ok: false, message: 'Ya existe un usuario con ese correo electrónico' });
      }
    }

    // Construir la query dinámicamente según los campos enviados
    const setClauses = [];
    const values = [];
    let paramIndex = 1;

    if (nombre) { setClauses.push(`nombre = $${paramIndex++}`); values.push(nombre); }
    if (rol)    { setClauses.push(`rol = $${paramIndex++}`);    values.push(rol); }
    if (correo) { setClauses.push(`correo = $${paramIndex++}`); values.push(correo); }

    // Solo actualizar password si se envió uno nuevo
    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      setClauses.push(`password = $${paramIndex++}`);
      values.push(hashedPassword);
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ ok: false, message: 'No se recibieron campos para actualizar' });
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE usuarios
       SET ${setClauses.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING id, nombre, rol, correo, created_at, updated_at, deleted_at`,
      values
    );

    res.json({ ok: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ ok: false, message: 'Error interno del servidor' });
  }
});

// ─── DELETE /api/usuarios/:id ────────────────────────────────────────────────
// Soft delete: establece deleted_at = NOW(). No borra el registro.
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE usuarios
       SET deleted_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING id`,
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ ok: false, message: 'Usuario no encontrado o ya eliminado' });
    }
    res.json({ ok: true, message: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ ok: false, message: 'Error interno del servidor' });
  }
});


// ─── POST /api/usuarios/login ─────────────────────────────────────────────────
const jwt = require('jsonwebtoken');
const { verifyToken } = require('../middleware/auth');

router.post('/login', async (req, res) => {
  const { correo, password } = req.body;
  if (!correo || !password) {
    return res.status(400).json({ ok: false, message: 'Correo y contraseña requeridos' });
  }
  try {
    const result = await pool.query(
      `SELECT id, nombre, rol, correo, password FROM usuarios WHERE correo = $1 AND deleted_at IS NULL`,
      [correo]
    );
    if (result.rowCount === 0) {
      return res.status(401).json({ ok: false, message: 'Credenciales inválidas' });
    }
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ ok: false, message: 'Credenciales inválidas' });
    }

    // Emitir JWT
    const payload = { id: user.id, nombre: user.nombre, rol: user.rol, correo: user.correo };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    res.json({ ok: true, token, data: payload });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ ok: false, message: 'Error interno del servidor' });
  }
});

// ─── GET /api/usuarios/me ─────────────────────────────────────────────────────
// Verifica el token y devuelve el perfil actualizado desde la BD.
router.get('/me', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, nombre, rol, correo FROM usuarios WHERE id = $1 AND deleted_at IS NULL`,
      [req.user.id]
    );
    if (result.rowCount === 0) {
      return res.status(401).json({ ok: false, message: 'Usuario no encontrado' });
    }
    res.json({ ok: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error interno del servidor' });
  }
});

module.exports = router;
