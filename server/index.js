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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Servidor corriendo en http://localhost:${PORT}`));