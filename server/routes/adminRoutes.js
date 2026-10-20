// server/routes/adminRoutes.js
const express    = require('express');
const router     = express.Router();
const pool       = require('../config/db');
const verifyAdmin = require('../middleware/verifyAdmin');

// Aplicar middleware a todas las rutas de este router
router.use(verifyAdmin);

// ════════════════════════════════════════════════════
// 📊 STATS GLOBALES
// ════════════════════════════════════════════════════
router.get('/stats', async (req, res) => {
  try {
    const [general, registrosPorDia, actividadSemana] = await Promise.all([
      pool.query(`SELECT * FROM vista_admin_stats`),
      pool.query(`
        SELECT DATE(fecha_registro) as fecha, COUNT(*) as nuevos
        FROM usuarios
        WHERE fecha_registro >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(fecha_registro)
        ORDER BY fecha ASC
      `),
      pool.query(`
        SELECT DATE(fecha) as dia, COUNT(*) as entrenamientos
        FROM progreso_rutinas
        WHERE fecha >= NOW() - INTERVAL '7 days'
        GROUP BY DATE(fecha)
        ORDER BY dia ASC
      `)
    ]);

    res.json({
      resumen: general.rows[0],
      registro_diario: registrosPorDia.rows,
      actividad_semana: actividadSemana.rows
    });
  } catch (err) {
    console.error('❌ admin/stats:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════════
// 👥 GESTIÓN DE USUARIOS
// ════════════════════════════════════════════════════

// Listar todos los usuarios (con paginación y búsqueda)
router.get('/usuarios', async (req, res) => {
  try {
    const { buscar = '', pagina = 1, limite = 20 } = req.query;
    const offset = (Number(pagina) - 1) * Number(limite);

    const where = buscar
      ? `WHERE u.nombre ILIKE $3 OR u.email ILIKE $3`
      : '';
    const params = buscar
      ? [Number(limite), offset, `%${buscar}%`]
      : [Number(limite), offset];

    const [usuarios, total] = await Promise.all([
      pool.query(
        `SELECT * FROM vista_admin_usuarios
         ${where}
         ORDER BY fecha_registro DESC
         LIMIT $1 OFFSET $2`,
        params
      ),
      pool.query(
        `SELECT COUNT(*) as total FROM usuarios
         ${buscar ? `WHERE nombre ILIKE $1 OR email ILIKE $1` : ''}`,
        buscar ? [`%${buscar}%`] : []
      )
    ]);

    res.json({
      usuarios: usuarios.rows,
      total: parseInt(total.rows[0].total),
      pagina: Number(pagina),
      total_paginas: Math.ceil(parseInt(total.rows[0].total) / Number(limite))
    });
  } catch (err) {
    console.error('❌ admin/usuarios:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Obtener perfil completo de un usuario
router.get('/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [perfil, historialPeso, constancia, entrenamientos, triaje] = await Promise.all([
      pool.query(`SELECT * FROM vista_admin_usuarios WHERE id_usuario = $1`, [id]),
      pool.query(
        `SELECT peso_kg, fecha_registro FROM historial_medidas
         WHERE id_usuario = $1 ORDER BY fecha_registro ASC LIMIT 30`,
        [id]
      ),
      pool.query(
        `SELECT fecha, porcentaje FROM constancia_diaria
         WHERE id_usuario = $1 ORDER BY fecha DESC LIMIT 30`,
        [id]
      ),
      pool.query(
        `SELECT DATE(fecha) as dia FROM progreso_rutinas
         WHERE id_usuario = $1 ORDER BY fecha DESC LIMIT 30`,
        [id]
      ),
      pool.query(
        `SELECT * FROM perfil_salud_triaje WHERE id_usuario = $1`,
        [id]
      )
    ]);

    if (perfil.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({
      perfil: perfil.rows[0],
      historial_peso: historialPeso.rows,
      constancia: constancia.rows,
      entrenamientos: entrenamientos.rows,
      triaje: triaje.rows[0] || null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cambiar rol de usuario
router.patch('/usuarios/:id/rol', async (req, res) => {
  try {
    const { id } = req.params;
    const { rol } = req.body;

    if (!['usuario', 'admin'].includes(rol)) {
      return res.status(400).json({ error: 'Rol inválido' });
    }
    if (Number(id) === req.adminId) {
      return res.status(400).json({ error: 'No puedes cambiar tu propio rol' });
    }

    await pool.query(`UPDATE usuarios SET rol = $1 WHERE id_usuario = $2`, [rol, id]);
    res.json({ success: true, mensaje: `Rol actualizado a ${rol}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Activar / suspender cuenta
router.patch('/usuarios/:id/estado', async (req, res) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;

    if (Number(id) === req.adminId) {
      return res.status(400).json({ error: 'No puedes suspender tu propia cuenta' });
    }

    await pool.query(`UPDATE usuarios SET activo = $1 WHERE id_usuario = $2`, [activo, id]);
    res.json({ success: true, mensaje: activo ? 'Cuenta activada' : 'Cuenta suspendida' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Eliminar usuario (con todas sus relaciones en cascada)
router.delete('/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (Number(id) === req.adminId) {
      return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' });
    }

    // Verificar que no sea el último admin
    const admins = await pool.query(
      `SELECT COUNT(*) as total FROM usuarios WHERE rol = 'admin' AND activo = TRUE`
    );
    const esAdmin = await pool.query(
      `SELECT rol FROM usuarios WHERE id_usuario = $1`, [id]
    );

    if (esAdmin.rows[0]?.rol === 'admin' && parseInt(admins.rows[0].total) <= 1) {
      return res.status(400).json({ error: 'No puedes eliminar el único administrador' });
    }

    await pool.query(`DELETE FROM usuarios WHERE id_usuario = $1`, [id]);
    res.json({ success: true, mensaje: 'Usuario eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════════
// 🍏 CATÁLOGO DE ALIMENTOS
// ════════════════════════════════════════════════════
router.get('/catalogo/alimentos', async (req, res) => {
  try {
    const { buscar = '', grupo = '' } = req.query;
    const conditions = [];
    const params = [];

    if (buscar) {
      params.push(`%${buscar}%`);
      conditions.push(`nombre ILIKE $${params.length}`);
    }
    if (grupo) {
      params.push(`%${grupo}%`);
      conditions.push(`grupo_nutricional ILIKE $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await pool.query(
      `SELECT * FROM catalogo_comida ${where} ORDER BY grupo_nutricional, nombre LIMIT 200`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/catalogo/alimentos', async (req, res) => {
  try {
    const { nombre, grupo_nutricional, cantidad_base, unidad_medida, calorias_kcal, proteina_g, lipidos_g, carbohidratos_g } = req.body;
    const result = await pool.query(
      `INSERT INTO catalogo_comida (nombre, grupo_nutricional, cantidad_base, unidad_medida, calorias_kcal, proteina_g, lipidos_g, carbohidratos_g)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [nombre, grupo_nutricional, cantidad_base, unidad_medida, calorias_kcal, proteina_g, lipidos_g, carbohidratos_g]
    );
    res.json({ success: true, alimento: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/catalogo/alimentos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, grupo_nutricional, cantidad_base, unidad_medida, calorias_kcal, proteina_g, lipidos_g, carbohidratos_g } = req.body;
    const result = await pool.query(
      `UPDATE catalogo_comida SET
        nombre=$1, grupo_nutricional=$2, cantidad_base=$3, unidad_medida=$4,
        calorias_kcal=$5, proteina_g=$6, lipidos_g=$7, carbohidratos_g=$8
       WHERE id_comida=$9 RETURNING *`,
      [nombre, grupo_nutricional, cantidad_base, unidad_medida, calorias_kcal, proteina_g, lipidos_g, carbohidratos_g, id]
    );
    res.json({ success: true, alimento: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/catalogo/alimentos/:id', async (req, res) => {
  try {
    await pool.query(`DELETE FROM catalogo_comida WHERE id_comida = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════════
// 💪 CATÁLOGO DE EJERCICIOS
// ════════════════════════════════════════════════════
router.get('/catalogo/ejercicios', async (req, res) => {
  try {
    const { buscar = '', grupo = '' } = req.query;
    const conditions = [];
    const params = [];

    if (buscar) {
      params.push(`%${buscar}%`);
      conditions.push(`nombre ILIKE $${params.length}`);
    }
    if (grupo) {
      params.push(`%${grupo}%`);
      conditions.push(`grupo_muscular ILIKE $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await pool.query(
      `SELECT * FROM cat_ejercicios ${where} ORDER BY grupo_muscular, nombre LIMIT 200`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/catalogo/ejercicios', async (req, res) => {
  try {
    const { nombre, grupo_muscular, dificultad, nivel_impacto, objetivo_enfocado, series_sugeridas, repeticiones_sugeridas, descripcion } = req.body;
    const result = await pool.query(
      `INSERT INTO cat_ejercicios (nombre, grupo_muscular, dificultad, nivel_impacto, objetivo_enfocado, series_sugeridas, repeticiones_sugeridas, descripcion)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [nombre, grupo_muscular, dificultad, nivel_impacto, objetivo_enfocado, series_sugeridas, repeticiones_sugeridas, descripcion]
    );
    res.json({ success: true, ejercicio: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/catalogo/ejercicios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, grupo_muscular, dificultad, nivel_impacto, objetivo_enfocado, series_sugeridas, repeticiones_sugeridas, descripcion } = req.body;
    const result = await pool.query(
      `UPDATE cat_ejercicios SET
        nombre=$1, grupo_muscular=$2, dificultad=$3, nivel_impacto=$4,
        objetivo_enfocado=$5, series_sugeridas=$6, repeticiones_sugeridas=$7, descripcion=$8
       WHERE id_ejercicio=$9 RETURNING *`,
      [nombre, grupo_muscular, dificultad, nivel_impacto, objetivo_enfocado, series_sugeridas, repeticiones_sugeridas, descripcion, id]
    );
    res.json({ success: true, ejercicio: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/catalogo/ejercicios/:id', async (req, res) => {
  try {
    await pool.query(`DELETE FROM cat_ejercicios WHERE id_ejercicio = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════════
// 📋 TRIAJES MÉDICOS
// ════════════════════════════════════════════════════
router.get('/triajes', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        u.id_usuario, u.nombre, u.email,
        pst.*
      FROM perfil_salud_triaje pst
      JOIN usuarios u ON pst.id_usuario = u.id_usuario
      ORDER BY pst.fecha_evaluacion DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════════
// 🔍 VERIFICAR ROL (para el frontend al cargar)
// ════════════════════════════════════════════════════
// Este endpoint NO usa verifyAdmin (no está bajo router.use)
// Se registra en index.js por separado

module.exports = router