const pool = require('../config/db');
const bcrypt = require('bcryptjs');

const register = async (req, res) => {
    const { nombre, email, password, fecha_nacimiento, sexo, padece_enfermedad, enfermedades_declaradas, apto_alto_impacto, acepto_disclaimer } = req.body;
    try {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        await pool.query('BEGIN');
        const userResult = await pool.query(
            `INSERT INTO usuarios (nombre, email, password_hash, fecha_nacimiento, sexo, acepto_disclaimer) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id_usuario`,
            [nombre, email, passwordHash, fecha_nacimiento, sexo, acepto_disclaimer]
        );
        const idUsuario = userResult.rows[0].id_usuario;
        await pool.query(
            `INSERT INTO perfil_salud_triaje (id_usuario, padece_enfermedad, enfermedades_declaradas, apto_alto_impacto) 
             VALUES ($1, $2, $3, $4)`,
            [idUsuario, padece_enfermedad, enfermedades_declaradas, apto_alto_impacto]
        );
        await pool.query('COMMIT');
        res.status(201).json({ message: "Usuario registrado", userId: idUsuario });
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error("ERROR REGISTRO:", error);
        res.status(500).json({ error: "Error en registro" });
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM usuarios WHERE LOWER(email) = LOWER($1)', [email]);
        if (result.rows.length === 0) return res.status(404).json({ error: "Correo no registrado" });

        const usuario = result.rows[0];
        const validPassword = await bcrypt.compare(password, usuario.password_hash);
        if (!validPassword) return res.status(401).json({ error: "Contraseña incorrecta" });

        res.json({ 
            message: "¡Bienvenido!", 
            userId: usuario.id_usuario, 
            user: { id: usuario.id_usuario, nombre: usuario.nombre } 
        });
    } catch (error) {
        console.error("ERROR LOGIN:", error);
        res.status(500).json({ error: "Error en servidor" });
    }
};

module.exports = { register, login };