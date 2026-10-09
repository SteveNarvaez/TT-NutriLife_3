const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const pool = require('./config/db');
dotenv.config();

const authRoutes    = require('./routes/authRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');
const triajeRoutes  = require('./routes/triajeRoutes');

const app = express(); // ← PRIMERO se crea app

app.use(cors());
app.use(express.json());

// LUEGO se registran las rutas
app.use('/api/auth',    authRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/triaje',  triajeRoutes);

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

    // Buscar la dieta generada hoy para ese momento
    const dieta = await pool.query(
      `SELECT * FROM dieta_diaria 
       WHERE id_usuario = $1 AND momento_dia = $2 AND fecha = CURRENT_DATE`,
      [id_usuario, momento_dia]
    );

    if (dieta.rows.length === 0) {
      return res.json({ success: false, mensaje: 'No hay dieta generada para hoy. Pide tu dieta al asistente primero.' });
    }

    const d = dieta.rows[0];

    // Insertar los 3 alimentos del momento en diario_alimentos
    await pool.query(
      `INSERT INTO diario_alimentos (id_usuario, id_alimento, cantidad_porciones, momento_dia, fecha_registro)
       VALUES ($1,$2,$3,$4,CURRENT_DATE),($1,$5,$6,$4,CURRENT_DATE),($1,$7,$8,$4,CURRENT_DATE)
       ON CONFLICT DO NOTHING`,
      [id_usuario,
       d.id_alimento_proteina,   d.porciones_proteina,
       momento_dia,
       d.id_alimento_guarnicion, d.porciones_guarnicion,
       d.id_alimento_fresco,     d.porciones_fresco]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
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
// ── RACHA DE ENTRENAMIENTOS ──
app.get('/api/graficas/racha/:id_usuario', async (req, res) => {
  try {
    const { id_usuario } = req.params;
    const result = await pool.query(
      `SELECT DATE(fecha) as fecha
       FROM progreso_rutinas
       WHERE id_usuario = $1
       AND fecha >= NOW() - INTERVAL '90 days'
       ORDER BY fecha ASC`,
      [id_usuario]
    );
    const fechasEntrenadas = new Set(result.rows.map(r => r.fecha.toISOString().split('T')[0]));
    res.json({ fechas: [...fechasEntrenadas] });
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

    const peso = await pool.query(
      `SELECT peso_kg FROM historial_medidas WHERE id_usuario = $1 ORDER BY fecha_registro DESC LIMIT 1`,
      [id_usuario]
    );
    const meta = await pool.query(
      `SELECT tmb_calculado FROM historial_medidas WHERE id_usuario = $1 ORDER BY fecha_registro DESC LIMIT 1`,
      [id_usuario]
    );
    const entrenamientos = await pool.query(
      `SELECT COUNT(*) as total FROM progreso_rutinas 
       WHERE id_usuario = $1 AND fecha >= date_trunc('month', NOW())`,
      [id_usuario]
    );
    const rachaQuery = await pool.query(
      `SELECT COUNT(DISTINCT DATE(fecha)) as racha 
       FROM progreso_rutinas 
       WHERE id_usuario = $1 
       AND fecha >= NOW() - INTERVAL '30 days'`,
      [id_usuario]
    );

    res.json({
      peso:                 peso.rows[0]?.peso_kg || 0,
      meta_calorica:        meta.rows[0]?.tmb_calculado || 0,
      entrenamientos_mes:   entrenamientos.rows[0]?.total || 0,
      racha_dias:           rachaQuery.rows[0]?.racha || 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Servidor corriendo en http://localhost:${PORT}`));