const pool     = require('../config/db');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// ──────────────────────────────────────────────────────────
//  Configuración del transporter de email (Gmail con App Password)
// ──────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,   // tu Gmail: ej. nutrilifeapp@gmail.com
    pass: process.env.EMAIL_PASS,   // App Password de Google (no la contraseña normal)
  },
});

// ──────────────────────────────────────────────────────────
//  REGISTER
//  - Guarda usuario con email_verificado = false
//  - Genera un JWT de verificación (expira en 24 h)
//  - Envía email con el link de verificación
// ──────────────────────────────────────────────────────────
const register = async (req, res) => {
  const { nombre, email, password, fecha_nacimiento, sexo, acepto_disclaimer } = req.body;
  try {
    // 1. Hash de la contraseña
    const salt         = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 2. Insertar usuario (email_verificado = false por defecto)
    const userResult = await pool.query(
      `INSERT INTO usuarios (nombre, email, password_hash, fecha_nacimiento, sexo, acepto_disclaimer)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id_usuario`,
      [nombre, email, passwordHash, fecha_nacimiento, sexo, acepto_disclaimer || false]
    );
    const idUsuario = userResult.rows[0].id_usuario;

    // 3. Generar token JWT de verificación
    const token = jwt.sign(
      { id_usuario: idUsuario, email },
      process.env.JWT_VERIFY_SECRET,
      { expiresIn: '24h' }
    );

    // 4. Construir link de verificación
    const baseUrl    = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verifyLink = `${baseUrl}/verificar-email?token=${token}`;

    // 5. Enviar email
    await transporter.sendMail({
      from:    `"NutriLife 🍏" <${process.env.EMAIL_USER}>`,
      to:      email,
      subject: '¡Verifica tu correo en NutriLife!',
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#f9fafb;border-radius:16px;">
          <h2 style="color:#16a34a;text-align:center;">¡Bienvenido a NutriLife, ${nombre}! 🍏</h2>
          <p style="color:#374151;text-align:center;">
            Ya casi terminas. Haz clic en el botón para verificar tu correo y activar tu cuenta.
          </p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${verifyLink}"
               style="background:#16a34a;color:#fff;padding:14px 32px;border-radius:12px;
                      text-decoration:none;font-weight:bold;font-size:16px;display:inline-block;">
              ✅ Verificar mi correo
            </a>
          </div>
          <p style="color:#9ca3af;font-size:12px;text-align:center;">
            Este enlace expira en <strong>24 horas</strong>.<br>
            Si no creaste una cuenta en NutriLife, ignora este mensaje.
          </p>
        </div>
      `,
    });

    console.log(`📧 Email de verificación enviado a ${email}`);
    res.status(201).json({
      message: 'Cuenta creada. Revisa tu correo para verificarla.',
      userId: idUsuario,
    });

  } catch (error) {
    console.error('ERROR REGISTRO:', error);
    // Si el email falla después de crear el usuario, igual avisamos al cliente
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Este correo ya está registrado.' });
    }
    res.status(500).json({ error: 'Error en registro' });
  }
};

// ──────────────────────────────────────────────────────────
//  VERIFY EMAIL
//  GET /api/auth/verificar-email?token=xxx
//  - Decodifica el JWT
//  - Marca email_verificado = true en la BD
// ──────────────────────────────────────────────────────────
const verifyEmail = async (req, res) => {
  const { token } = req.query;
  if (!token) {
    return res.status(400).json({ error: 'Token requerido.' });
  }

  try {
    // 1. Verificar y decodificar el JWT
    const decoded = jwt.verify(token, process.env.JWT_VERIFY_SECRET);

    // 2. Actualizar email_verificado en la BD
    const result = await pool.query(
      `UPDATE usuarios SET email_verificado = TRUE
       WHERE id_usuario = $1 AND email = $2
       RETURNING id_usuario, nombre, email`,
      [decoded.id_usuario, decoded.email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado o ya verificado.' });
    }

    console.log(`✅ Email verificado: ${decoded.email}`);
    res.json({
      success: true,
      message: '¡Tu correo fue verificado! Ya puedes iniciar sesión.',
      nombre: result.rows[0].nombre,
    });

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ error: 'El enlace expiró. Registra tu cuenta de nuevo o solicita un nuevo correo.' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({ error: 'Enlace inválido.' });
    }
    console.error('ERROR VERIFY EMAIL:', error);
    res.status(500).json({ error: 'Error al verificar el correo.' });
  }
};

// ──────────────────────────────────────────────────────────
//  REENVIAR EMAIL DE VERIFICACIÓN
//  POST /api/auth/reenviar-verificacion  { email }
// ──────────────────────────────────────────────────────────
const reenviarVerificacion = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email requerido.' });

  try {
    const result = await pool.query(
      `SELECT id_usuario, nombre, email_verificado FROM usuarios WHERE LOWER(email) = LOWER($1)`,
      [email]
    );

    if (result.rows.length === 0) {
      // No revelamos si el email existe o no (seguridad)
      return res.json({ message: 'Si el correo está registrado, recibirás un enlace.' });
    }

    const usuario = result.rows[0];
    if (usuario.email_verificado) {
      return res.json({ message: 'Este correo ya está verificado. Puedes iniciar sesión.' });
    }

    // Generar nuevo token y reenviar
    const token = jwt.sign(
      { id_usuario: usuario.id_usuario, email },
      process.env.JWT_VERIFY_SECRET,
      { expiresIn: '24h' }
    );

    const baseUrl    = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verifyLink = `${baseUrl}/verificar-email?token=${token}`;

    await transporter.sendMail({
      from:    `"NutriLife 🍏" <${process.env.EMAIL_USER}>`,
      to:      email,
      subject: 'Nuevo enlace de verificación — NutriLife',
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#f9fafb;border-radius:16px;">
          <h2 style="color:#16a34a;text-align:center;">Nuevo enlace de verificación 🔁</h2>
          <p style="color:#374151;text-align:center;">
            Hola ${usuario.nombre}, aquí está tu nuevo enlace para verificar tu cuenta.
          </p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${verifyLink}"
               style="background:#16a34a;color:#fff;padding:14px 32px;border-radius:12px;
                      text-decoration:none;font-weight:bold;font-size:16px;display:inline-block;">
              ✅ Verificar mi correo
            </a>
          </div>
          <p style="color:#9ca3af;font-size:12px;text-align:center;">
            Este enlace expira en <strong>24 horas</strong>.
          </p>
        </div>
      `,
    });

    res.json({ message: 'Si el correo está registrado, recibirás un enlace.' });

  } catch (error) {
    console.error('ERROR REENVIAR VERIFICACION:', error);
    res.status(500).json({ error: 'Error al reenviar el correo.' });
  }
};

// ──────────────────────────────────────────────────────────
//  LOGIN
//  - Bloquea si email_verificado = false
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

    // Verificar contraseña primero (no revelar si el email existe antes)
    const validPassword = await bcrypt.compare(password, usuario.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    // Verificar si el email fue confirmado
    if (!usuario.email_verificado) {
      return res.status(403).json({
        error: 'EMAIL_NO_VERIFICADO',
        message: 'Debes verificar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.',
        email: usuario.email,
      });
    }

    res.json({
      message: '¡Bienvenido!',
      userId: usuario.id_usuario,
      user: { id: usuario.id_usuario, nombre: usuario.nombre },
    });

  } catch (error) {
    console.error('ERROR LOGIN:', error);
    res.status(500).json({ error: 'Error en servidor' });
  }
};

module.exports = { register, login, verifyEmail, reenviarVerificacion };