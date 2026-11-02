const pool   = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');

// ──────────────────────────────────────────────────────────
//  REGISTER
// ──────────────────────────────────────────────────────────
const register = async (req, res) => {
  const { nombre, email, password, fecha_nacimiento, sexo, acepto_disclaimer } = req.body;
  try {
    const salt         = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const userResult = await pool.query(
      `INSERT INTO usuarios (nombre, email, password_hash, fecha_nacimiento, sexo, acepto_disclaimer, email_verificado)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE) RETURNING id_usuario`,
      [nombre, email, passwordHash, fecha_nacimiento, sexo, acepto_disclaimer || false]
    );
    const idUsuario = userResult.rows[0].id_usuario;

    res.status(201).json({
      message: 'Cuenta creada exitosamente.',
      userId: idUsuario,
    });

  } catch (error) {
    console.error('ERROR REGISTRO:', error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Este correo ya está registrado.' });
    }
    res.status(500).json({ error: 'Error en registro' });
  }
};

// ──────────────────────────────────────────────────────────
//  LOGIN
// ──────────────────────────────────────────────────────────
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

    const validPassword = await bcrypt.compare(password, usuario.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

const token = jwt.sign(
  { id: usuario.id_usuario, email: usuario.email, rol: usuario.rol },
  process.env.JWT_VERIFY_SECRET,
  { expiresIn: '7d' }
);

    res.json({
      message: '¡Bienvenido!',
      token,                          // ← el frontend guarda esto
      userId: usuario.id_usuario,     // ← puedes quitarlo luego
      user: { id: usuario.id_usuario, nombre: usuario.nombre },
    });

  } catch (error) {
    console.error('ERROR LOGIN:', error);
    res.status(500).json({ error: 'Error en servidor' });
  }
};

// ──────────────────────────────────────────────────────────
//  GET PERFIL
// ──────────────────────────────────────────────────────────
const getPerfil = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT id_usuario, nombre, email, fecha_nacimiento, sexo, rol, activo,
              peso_kg, altura_cm, tmb_calculado, objetivo_actual, nivel_actividad,
              triaje_completado, created_at
       FROM usuarios
       WHERE id_usuario = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('ERROR GET PERFIL:', error);
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
};

module.exports = { register, login, getPerfil };