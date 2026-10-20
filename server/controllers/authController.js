// server/controllers/authController.js — versión v2 con rol en respuesta
const pool   = require('../config/db');
const bcrypt = require('bcryptjs');

const register = async (req, res) => {
  const { nombre, email, password, fecha_nacimiento, sexo, acepto_disclaimer } = req.body;
  try {
    const salt         = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const userResult = await pool.query(
      `INSERT INTO usuarios (nombre, email, password_hash, fecha_nacimiento, sexo, acepto_disclaimer)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id_usuario`,
      [nombre, email, passwordHash, fecha_nacimiento, sexo, acepto_disclaimer || false]
    );

    const idUsuario = userResult.rows[0].id_usuario;
    res.status(201).json({ message: 'Usuario registrado', userId: idUsuario });
  } catch (error) {
    console.error('ERROR REGISTRO:', error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Este correo ya está registrado' });
    }
    res.status(500).json({ error: 'Error en registro' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query(
      'SELECT * FROM usuarios WHERE LOWER(email) = LOWER($1)',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Correo no registrado' });
    }

    const usuario = result.rows[0];

    // Verificar si la cuenta está activa (col nueva; compatibilidad con DBs sin la col)
    if (usuario.activo === false) {
      return res.status(403).json({ error: 'Tu cuenta ha sido suspendida. Contacta al administrador.' });
    }

    const validPassword = await bcrypt.compare(password, usuario.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    // Actualizar último acceso
    try {
      await pool.query(
        `UPDATE usuarios SET ultimo_acceso = NOW() WHERE id_usuario = $1`,
        [usuario.id_usuario]
      );
    } catch (_) { /* Columna puede no existir aún — ignorar */ }

    res.json({
      message: '¡Bienvenido!',
      userId:  usuario.id_usuario,
      user: {
        id:     usuario.id_usuario,
        nombre: usuario.nombre,
        email:  usuario.email,
        rol:    usuario.rol || 'usuario',   // ← NUEVO: incluir rol
      }
    });
  } catch (error) {
    console.error('ERROR LOGIN:', error);
    res.status(500).json({ error: 'Error en servidor' });
  }
};

module.exports = { register, login };