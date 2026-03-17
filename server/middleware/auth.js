const jwt = require('jsonwebtoken');

/**
 * Middleware que verifica el JWT en el header Authorization.
 * Si es válido, adjunta el payload del token en req.user y continúa.
 * Si no, responde 401.
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ ok: false, message: 'No autenticado: token requerido' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id, nombre, rol, correo, iat, exp }
    next();
  } catch (err) {
    return res.status(401).json({ ok: false, message: 'Token inválido o expirado' });
  }
}

module.exports = { verifyToken };
