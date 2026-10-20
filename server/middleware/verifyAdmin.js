// server/middleware/verifyAdmin.js
const pool = require('../config/db');

/**
 * Middleware que verifica que el userId del body/params sea admin.
 * El frontend envía userId en el header X-User-Id o en el body.
 */
const verifyAdmin = async (req, res, next) => {
  try {
    const userId =
      req.headers['x-user-id'] ||
      req.body?.userId ||
      req.query?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const result = await pool.query(
      `SELECT rol, activo FROM usuarios WHERE id_usuario = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    const { rol, activo } = result.rows[0];

    if (!activo) {
      return res.status(403).json({ error: 'Cuenta suspendida' });
    }

    if (rol !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado: se requiere rol admin' });
    }

    // Actualizar último acceso
    await pool.query(
      `UPDATE usuarios SET ultimo_acceso = NOW() WHERE id_usuario = $1`,
      [userId]
    );

    req.adminId = Number(userId);
    next();
  } catch (err) {
    console.error('❌ verifyAdmin error:', err.message);
    res.status(500).json({ error: 'Error verificando permisos' });
  }
};

module.exports = verifyAdmin;