const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const pool = require('./config/db');
dotenv.config();

const authRoutes    = require('./routes/authRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');
const triajeRoutes  = require('./routes/triajeRoutes');
const adminRoutes   = require('./routes/adminRoutes');

const app = express(); // ← PRIMERO se crea app

// CORS: en producción solo permite el dominio de Netlify (FRONTEND_URL);
// en desarrollo permite localhost:5173.
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());

// LUEGO se registran las rutas
app.use('/api/auth',    authRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/triaje',  triajeRoutes);
app.use('/api/admin',   adminRoutes);

// 👇 AQUÍ AGREGAMOS LA NUEVA RUTA PARA LAS GRÁFICAS 👇
app.get('/api/graficas/peso/:id_usuario', async (req, res) => {
    try {
        const { id_usuario } = req.params;

        // Buscamos todos los pesos registrados, ordenados del más viejo al más nuevo
        const historialQuery = await pool.query(
            `SELECT peso_kg, fecha_registro 
             FROM historial_medidas 
             WHERE id_usuario = $1 
             ORDER BY fecha_registro ASC`,
            [id_usuario]
        );

        // Si no hay datos, mandamos un arreglo vacío
        if (historialQuery.rows.length === 0) {
            return res.json([]);
        }

        // Formateamos los datos para que la gráfica de React los entienda fácil
        const datosGrafica = historialQuery.rows.map(fila => {
            return {
                // Formateamos la fecha a algo legible (ej: "15/Oct")
                fecha: new Date(fila.fecha_registro).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
                peso: parseFloat(fila.peso_kg)
            };
        });

        res.json(datosGrafica);

    } catch (error) {
        console.error("❌ ERROR GET GRAFICAS:", error.message);
        res.status(500).json({ error: "Error al obtener datos para la gráfica" });
    }
});
// 👆 FIN DE LA RUTA DE GRÁFICAS 👆
// 👇 RUTA PARA OBTENER EL PESO ACTUAL (Para calcular el agua) 👇
app.get('/api/usuario/peso/:id_usuario', async (req, res) => {
    try {
        const { id_usuario } = req.params;
        const query = await pool.query(
            `SELECT peso_kg FROM historial_medidas WHERE id_usuario = $1 ORDER BY fecha_registro DESC LIMIT 1`,
            [id_usuario]
        );
        
        if (query.rows.length > 0) {
            res.json({ peso: parseFloat(query.rows[0].peso_kg) });
        } else {
            res.json({ peso: 70 }); // Un peso promedio por defecto si el usuario es nuevo
        }
    } catch (error) {
        console.error("❌ Error obteniendo peso:", error.message);
        res.status(500).json({ error: "Error en el servidor" });
    }
});
/////////
app.post('/api/rutina/registrar', async (req, res) => {
  try {
    const { id_usuario } = req.body;
    await pool.query(
      `INSERT INTO progreso_rutinas (id_usuario, fecha) VALUES ($1, NOW())`,
      [id_usuario]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
//////
// Registrar comida del Plan Diario en diario_alimentos
app.post('/api/plandiario/registrar-comida', async (req, res) => {
  try {
    const { id_usuario, momento_dia } = req.body;

    // ── 1. Obtener la semana ISO actual ───────────────────────────────────────
    const hoyQ = await pool.query(`SELECT EXTRACT(ISOYEAR FROM CURRENT_DATE) AS anio,
                                          EXTRACT(WEEK    FROM CURRENT_DATE) AS semana`);
    const anio    = parseInt(hoyQ.rows[0].anio);
    const semana  = parseInt(hoyQ.rows[0].semana);

    // ── 2. Buscar plan semanal del usuario ────────────────────────────────────
    const planQ = await pool.query(
      `SELECT dieta_json FROM plan_dieta_semanal
       WHERE id_usuario = $1 AND anio = $2 AND semana_iso = $3`,
      [id_usuario, anio, semana]
    );

    if (planQ.rows.length === 0) {
      return res.json({ success: false, mensaje: 'No tienes dieta generada esta semana. Pide tu dieta al asistente primero.' });
    }

    let dietaJson = planQ.rows[0].dieta_json;

    // ── 3. Aplicar override del día si existe ─────────────────────────────────
    const ovQ = await pool.query(
      `SELECT comida_json FROM cambios_dieta_dia
       WHERE id_usuario = $1 AND fecha = CURRENT_DATE AND momento_dia = $2`,
      [id_usuario, momento_dia]
    );
    if (ovQ.rows.length > 0) {
      dietaJson = { ...dietaJson, [momento_dia]: ovQ.rows[0].comida_json };
    }

    // ── 4. Extraer alimentos del momento solicitado ───────────────────────────
    const comida = dietaJson[momento_dia];
    if (!comida || !Array.isArray(comida.alimentos) || comida.alimentos.length === 0) {
      return res.json({ success: false, mensaje: `No se encontró "${momento_dia}" en tu plan de esta semana.` });
    }

    // ── 5. Insertar cada alimento en diario_alimentos (ignora duplicados) ─────
    for (const al of comida.alimentos) {
      if (!al.id || al.porciones == null) continue;
      // Verificar si ya existe antes de insertar
      const existe = await pool.query(
        `SELECT 1 FROM diario_alimentos
         WHERE id_usuario = $1 AND id_alimento = $2 AND momento_dia = $3 AND fecha_registro = CURRENT_DATE`,
        [id_usuario, al.id, momento_dia]
      );
      if (existe.rows.length === 0) {
        await pool.query(
          `INSERT INTO diario_alimentos (id_usuario, id_alimento, cantidad_porciones, momento_dia, fecha_registro)
           VALUES ($1, $2, $3, $4, CURRENT_DATE)`,
          [id_usuario, al.id, al.porciones, momento_dia]
        );
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error('❌ Error registrar-comida:', err.message);
    res.status(500).json({ error: err.message });
  }
});
// 👇 RUTA PARA OBTENER EL HISTORIAL DE CONSTANCIA (Gráfica de barras) 👇
app.get('/api/graficas/constancia/:id_usuario', async (req, res) => {
    try {
        const { id_usuario } = req.params;

        const constanciaQuery = await pool.query(
            `SELECT fecha, porcentaje 
             FROM constancia_diaria 
             WHERE id_usuario = $1 
             ORDER BY fecha ASC`,
            [id_usuario]
        );

        if (constanciaQuery.rows.length === 0) {
            return res.json([]);
        }

        // Formateamos las fechas igual que en la gráfica de peso
        const datosGrafica = constanciaQuery.rows.map(fila => {
            // Ajustamos la fecha para evitar problemas de zona horaria añadiendo 'T00:00:00'
            const fechaLimpia = new Date(fila.fecha.toISOString().split('T')[0] + 'T00:00:00');
            return {
                fecha: fechaLimpia.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
                porcentaje: fila.porcentaje
            };
        });

        res.json(datosGrafica);

    } catch (error) {
        console.error("❌ ERROR GET CONSTANCIA:", error.message);
        res.status(500).json({ error: "Error al obtener datos de constancia" });
    }
});

// 👇 RUTA PARA GUARDAR LA CONSTANCIA (El porcentaje diario) 👇
app.post('/api/constancia/guardar', async (req, res) => {
    try {
        const { id_usuario, porcentaje } = req.body;

        // La magia de PostgreSQL: "Si ya existe la fecha, actualiza; si no, inserta"
        await pool.query(
            `INSERT INTO constancia_diaria (id_usuario, fecha, porcentaje) 
             VALUES ($1, CURRENT_DATE, $2)
             ON CONFLICT (id_usuario, fecha) 
             DO UPDATE SET porcentaje = EXCLUDED.porcentaje`,
            [id_usuario, porcentaje]
        );

        res.json({ success: true, message: "Progreso guardado exitosamente" });
    } catch (error) {
        console.error("❌ Error guardando constancia:", error.message);
        res.status(500).json({ error: "Error guardando el progreso" });
    }
});
// ── CONSULTAR SI YA GUARDÓ HOY ──
app.get('/api/constancia/hoy/:id_usuario', async (req, res) => {
  try {
    const { id_usuario } = req.params;
    const result = await pool.query(
      `SELECT porcentaje FROM constancia_diaria
       WHERE id_usuario = $1 AND fecha = CURRENT_DATE`,
      [id_usuario]
    );
    if (result.rows.length > 0) {
      res.json({ yaGuardado: true, porcentaje: result.rows[0].porcentaje });
    } else {
      res.json({ yaGuardado: false });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── RACHA DE ENTRENAMIENTOS ──
app.get('/api/graficas/racha/:id_usuario', async (req, res) => {
  try {
    const { id_usuario } = req.params;
    const result = await pool.query(
      `SELECT DISTINCT DATE(fecha) as fecha
       FROM progreso_rutinas
       WHERE id_usuario = $1
       AND fecha >= NOW() - INTERVAL '90 days'
       ORDER BY fecha ASC`,
      [id_usuario]
    );
    const fechasEntrenadas = result.rows.map(r => r.fecha.toISOString().split('T')[0]);

    // Calcular racha consecutiva hacia atrás desde hoy
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    let rachaConsecutiva = 0;
    for (let i = 0; i < 90; i++) {
      const dia = new Date(hoy);
      dia.setDate(hoy.getDate() - i);
      const diaStr = dia.toISOString().split('T')[0];
      if (fechasEntrenadas.includes(diaStr)) {
        rachaConsecutiva++;
      } else {
        break; // se rompe la racha
      }
    }

    res.json({ fechas: fechasEntrenadas, racha_consecutiva: rachaConsecutiva });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── MACROS DEL DÍA ──
app.get('/api/graficas/macros/:id_usuario', async (req, res) => {
  try {
    const { id_usuario } = req.params;
    const result = await pool.query(
      `SELECT 
        ROUND(SUM(c.proteina_g * d.cantidad_porciones)::numeric, 1) as proteina,
        ROUND(SUM(c.carbohidratos_g * d.cantidad_porciones)::numeric, 1) as carbohidratos,
        ROUND(SUM(c.lipidos_g * d.cantidad_porciones)::numeric, 1) as grasas,
        ROUND(SUM(c.calorias_kcal * d.cantidad_porciones)::numeric, 0) as calorias
       FROM diario_alimentos d
       JOIN catalogo_comida c ON d.id_alimento = c.id_comida
       WHERE d.id_usuario = $1 AND d.fecha_registro = CURRENT_DATE`,
      [id_usuario]
    );
    res.json(result.rows[0] || { proteina: 0, carbohidratos: 0, grasas: 0, calorias: 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── STATS RESUMEN ──
app.get('/api/graficas/stats/:id_usuario', async (req, res) => {
  try {
    const { id_usuario } = req.params;

    const perfil = await pool.query(
      `SELECT peso_kg, tmb_calculado, nivel_actividad, objetivo_actual
       FROM historial_medidas WHERE id_usuario = $1
       ORDER BY fecha_registro DESC LIMIT 1`,
      [id_usuario]
    );

    // Verificar si el usuario completó el triaje comprobando si existe un registro
    // Se intenta leer triaje_completado; si la columna no existe en BD antigua,
    // se cae al fallback de COUNT(*) para máxima compatibilidad.
    let triajeCompletado = false;
    try {
      const triaje = await pool.query(
        `SELECT triaje_completado FROM perfil_salud_triaje WHERE id_usuario = $1`,
        [id_usuario]
      );
      triajeCompletado = triaje.rows[0]?.triaje_completado || false;
    } catch (triajeErr) {
      // La columna triaje_completado no existe en esta BD (versión antigua del schema)
      // Determinamos triaje por existencia del registro
      const triajeExiste = await pool.query(
        `SELECT COUNT(*) as total FROM perfil_salud_triaje WHERE id_usuario = $1`,
        [id_usuario]
      );
      triajeCompletado = parseInt(triajeExiste.rows[0]?.total || 0) > 0;
    }

    const entrenamientos = await pool.query(
      `SELECT COUNT(*) as total FROM progreso_rutinas
       WHERE id_usuario = $1 AND fecha >= date_trunc('month', NOW())`,
      [id_usuario]
    );
    const rachaQuery = await pool.query(
      `SELECT COUNT(DISTINCT DATE(fecha)) as racha
       FROM progreso_rutinas
       WHERE id_usuario = $1 AND fecha >= NOW() - INTERVAL '30 days'`,
      [id_usuario]
    );

    res.json({
      peso:                perfil.rows[0]?.peso_kg || 0,
      meta_calorica:       perfil.rows[0]?.tmb_calculado || 0,
      nivel_actividad:     perfil.rows[0]?.nivel_actividad || null,
      objetivo_actual:     perfil.rows[0]?.objetivo_actual || null,
      triaje_completado:   triajeCompletado,
      entrenamientos_mes:  parseInt(entrenamientos.rows[0]?.total || 0),
      racha_dias:          parseInt(rachaQuery.rows[0]?.racha || 0)
    });
  } catch (err) {
    console.error('❌ Error en /api/graficas/stats:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── TEST: llamar registrar-comida con verbose para ver exactamente qué pasa ──
app.get('/api/debug/test-registrar/:id_usuario/:momento', async (req, res) => {
  const { id_usuario, momento } = req.params;
  try {
    const hoyQ = await pool.query(`SELECT EXTRACT(ISOYEAR FROM CURRENT_DATE) AS anio,
                                          EXTRACT(WEEK    FROM CURRENT_DATE) AS semana`);
    const anio   = parseInt(hoyQ.rows[0].anio);
    const semana = parseInt(hoyQ.rows[0].semana);

    const planQ = await pool.query(
      `SELECT dieta_json FROM plan_dieta_semanal WHERE id_usuario = $1 AND anio = $2 AND semana_iso = $3`,
      [id_usuario, anio, semana]
    );

    if (planQ.rows.length === 0) {
      return res.json({ paso: 'plan_no_encontrado', anio, semana, id_usuario });
    }

    const dietaJson = planQ.rows[0].dieta_json;
    const comida    = dietaJson[momento];

    if (!comida) {
      return res.json({ paso: 'momento_no_encontrado', momento, claves_en_json: Object.keys(dietaJson) });
    }

    const insertados = [];
    for (const al of (comida.alimentos || [])) {
      if (!al.id || al.porciones == null) { insertados.push({ al, skip: 'sin id o porciones' }); continue; }
      const existe = await pool.query(
        `SELECT 1 FROM diario_alimentos
         WHERE id_usuario = $1 AND id_alimento = $2 AND momento_dia = $3 AND fecha_registro = CURRENT_DATE`,
        [id_usuario, al.id, momento]
      );
      if (existe.rows.length === 0) {
        await pool.query(
          `INSERT INTO diario_alimentos (id_usuario, id_alimento, cantidad_porciones, momento_dia, fecha_registro)
           VALUES ($1, $2, $3, $4, CURRENT_DATE)`,
          [id_usuario, al.id, al.porciones, momento]
        );
        insertados.push({ alimento: al.nombre, id: al.id, porciones: al.porciones, insertado: true });
      } else {
        insertados.push({ alimento: al.nombre, id: al.id, insertado: false, razon: 'ya existía' });
      }
    }

    res.json({ paso: 'ok', anio, semana, momento, alimentos_en_plan: comida.alimentos, insertados });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DIAGNÓSTICO: ver qué hay en las tablas clave para un usuario hoy ──
app.get('/api/debug/:id_usuario', async (req, res) => {
  const { id_usuario } = req.params;
  try {
    const [diario, constancia, rutina, planSemanal] = await Promise.all([
      pool.query(
        `SELECT d.id_registro, d.id_alimento, d.cantidad_porciones, d.momento_dia, d.fecha_registro,
                c.nombre, c.calorias_kcal, c.proteina_g, c.carbohidratos_g, c.lipidos_g
         FROM diario_alimentos d
         LEFT JOIN catalogo_comida c ON d.id_alimento = c.id_comida
         WHERE d.id_usuario = $1 AND d.fecha_registro = CURRENT_DATE`,
        [id_usuario]
      ),
      pool.query(
        `SELECT * FROM constancia_diaria WHERE id_usuario = $1 AND fecha = CURRENT_DATE`,
        [id_usuario]
      ),
      pool.query(
        `SELECT * FROM progreso_rutinas WHERE id_usuario = $1 ORDER BY fecha DESC LIMIT 5`,
        [id_usuario]
      ),
      pool.query(
        `SELECT anio, semana_iso, fenotipo, calorias_objetivo,
                jsonb_object_keys(dieta_json) as momentos_disponibles
         FROM plan_dieta_semanal WHERE id_usuario = $1
         ORDER BY anio DESC, semana_iso DESC LIMIT 3`,
        [id_usuario]
      ),
    ]);
    res.json({
      diario_alimentos_hoy:    diario.rows,
      constancia_hoy:          constancia.rows,
      progreso_rutinas_reciente: rutina.rows,
      plan_dieta_semanal:      planSemanal.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Servidor corriendo en http://localhost:${PORT}`));