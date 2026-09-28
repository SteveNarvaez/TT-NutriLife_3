// server/controllers/chatbotController.js
const { SessionsClient } = require('@google-cloud/dialogflow-cx');
const { GoogleGenAI } = require('@google/genai');
const pool = require('../config/db');

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

// ═══════════════════════════════════════════════════
// 🔧 FUNCIONES QUE CONSULTAN TU BD REAL
// ═══════════════════════════════════════════════════

async function buscarAlimentos({ grupo_nutricional, calorias_max }) {
  const query = grupo_nutricional
    ? `SELECT nombre, grupo_nutricional, calorias_kcal, proteina_g, lipidos_g, carbohidratos_g, cantidad_base, unidad_medida
       FROM catalogo_comida WHERE grupo_nutricional ILIKE $1 AND calorias_kcal <= $2 LIMIT 8`
    : `SELECT nombre, grupo_nutricional, calorias_kcal, proteina_g, lipidos_g, carbohidratos_g, cantidad_base, unidad_medida
       FROM catalogo_comida WHERE calorias_kcal <= $1 LIMIT 8`;

  const params = grupo_nutricional
    ? [`%${grupo_nutricional}%`, calorias_max || 500]
    : [calorias_max || 500];

  const result = await pool.query(query, params);
  return result.rows;
}

async function buscarEjercicios({ grupo_muscular, id_usuario }) {
  // 1. Obtener perfil del usuario para aplicar la lógica
  const perfil = await pool.query(
    `SELECT nivel_actividad, objetivo_actual FROM historial_medidas 
     WHERE id_usuario = $1 ORDER BY fecha_registro DESC LIMIT 1`,
    [id_usuario]
  );

  let cantidadEjercicios = 2; // principiante por default
  let repSugeridas = null;    // null = usar las de la BD

  if (perfil.rows.length > 0) {
    const nivel   = perfil.rows[0].nivel_actividad?.toLowerCase() || '';
    const objetivo = perfil.rows[0].objetivo_actual?.toLowerCase() || '';

    // 🏋️ Cantidad según nivel
    if (nivel.includes('avanzado') || nivel.includes('intenso')) {
      cantidadEjercicios = 4;
    } else if (nivel.includes('intermedio') || nivel.includes('moderado')) {
      cantidadEjercicios = 3;
    } else {
      cantidadEjercicios = 2; // principiante / sedentario
    }

    // 🎯 Modificador de repeticiones según objetivo
    if (objetivo.includes('perder') || objetivo.includes('bajar') || objetivo.includes('grasa')) {
      repSugeridas = '15-20'; // más repeticiones para quemar
    } else if (objetivo.includes('ganar') || objetivo.includes('volumen') || objetivo.includes('masa')) {
      repSugeridas = '6-10';  // menos reps, más peso
    } else {
      repSugeridas = '10-15'; // mantenimiento
    }
  }

  // 2. Buscar por grupo muscular SOLAMENTE (sin filtrar dificultad ni objetivo)
  const conditions = [];
  const params = [];

  if (grupo_muscular) {
    conditions.push(`grupo_muscular ILIKE $${params.length + 1}`);
    params.push(`%${grupo_muscular}%`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const result = await pool.query(
    `SELECT nombre, grupo_muscular, series_sugeridas, repeticiones_sugeridas, descripcion, objetivo_enfocado
     FROM cat_ejercicios ${where} ORDER BY RANDOM() LIMIT $${params.length + 1}`,
    [...params, cantidadEjercicios]
  );

  return {
    ejercicios: result.rows,
    perfil_aplicado: {
      cantidad: cantidadEjercicios,
      repeticiones_recomendadas: repSugeridas
    }
  };
}

async function obtenerPerfilUsuario({ id_usuario }) {
  const medidas = await pool.query(
    `SELECT peso_kg, altura_cm, nivel_actividad, tmb_calculado, objetivo_actual
     FROM historial_medidas WHERE id_usuario = $1 ORDER BY fecha_registro DESC LIMIT 1`,
    [id_usuario]
  );
  const triaje = await pool.query(
    `SELECT padece_enfermedad, enfermedades_declaradas, apto_alto_impacto
     FROM perfil_salud_triaje WHERE id_usuario = $1`,
    [id_usuario]
  );
  return {
    medidas: medidas.rows[0] || null,
    triaje: triaje.rows[0] || null
  };
}

async function obtenerConsumoHoy({ id_usuario }) {
  const result = await pool.query(
    `SELECT c.nombre, c.calorias_kcal, c.proteina_g, d.cantidad_porciones, d.momento_dia,
            ROUND((c.calorias_kcal * d.cantidad_porciones)::numeric, 0) AS total_calorias
     FROM diario_alimentos d
     JOIN catalogo_comida c ON d.id_alimento = c.id_comida
     WHERE d.id_usuario = $1 AND d.fecha_registro = CURRENT_DATE
     ORDER BY d.id_registro`,
    [id_usuario]
  );
  const totalCal = result.rows.reduce((sum, r) => sum + Number(r.total_calorias), 0);
  return { registros: result.rows, total_calorias_hoy: totalCal };
}

async function actualizarPeso({ id_usuario, nuevo_peso }) {
  const actual = await pool.query(
    `SELECT altura_cm, nivel_actividad, tmb_calculado, objetivo_actual
     FROM historial_medidas WHERE id_usuario = $1
     ORDER BY fecha_registro DESC LIMIT 1`,
    [id_usuario]
  );

  if (actual.rows.length === 0) {
    return { error: 'No encontré tu perfil. Primero completa tu evaluación inicial.' };
  }

  const { altura_cm, nivel_actividad, tmb_calculado, objetivo_actual } = actual.rows[0];

  await pool.query(
    `INSERT INTO historial_medidas (id_usuario, peso_kg, altura_cm, nivel_actividad, tmb_calculado, objetivo_actual)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [id_usuario, nuevo_peso, altura_cm, nivel_actividad, tmb_calculado, objetivo_actual]
  );

  return {
    success: true,
    mensaje: `Peso actualizado a ${nuevo_peso} kg. ¡Tu gráfica ya refleja el cambio! 📈`
  };
}

async function generarDietaCompleta({ id_usuario }) {
  const userQuery = await pool.query(
    `SELECT tmb_calculado, objetivo_actual, peso_kg FROM historial_medidas
     WHERE id_usuario = $1 ORDER BY fecha_registro DESC LIMIT 1`,
    [id_usuario]
  );

  if (userQuery.rows.length === 0) {
    return { error: 'No encontré tu evaluación previa. Escribe "evaluación" para empezar.' };
  }

  const { tmb_calculado, objetivo_actual, peso_kg } = userQuery.rows[0];
  const caloriasMeta = Number(tmb_calculado);
  const objLimpio = objetivo_actual.toLowerCase();

  let protGramos, grasaGramos, tipoDieta;

  if (objLimpio.includes('perder') || objLimpio.includes('definicion') || objLimpio.includes('grasa')) {
    tipoDieta = 'Definición (Pérdida de grasa) 🔥';
    protGramos = peso_kg * 2.2;
    grasaGramos = peso_kg * 0.8;
  } else if (objLimpio.includes('ganar') || objLimpio.includes('volumen') || objLimpio.includes('masa')) {
    tipoDieta = 'Volumen (Ganar masa) 📈';
    protGramos = peso_kg * 2.0;
    grasaGramos = peso_kg * 1.0;
  } else {
    tipoDieta = 'Mantenimiento (Recomposición) ⚖️';
    protGramos = peso_kg * 1.8;
    grasaGramos = peso_kg * 1.0;
  }

  const carbGramos = Math.round((caloriasMeta - (protGramos * 4) - (grasaGramos * 9)) / 4);
  protGramos = Math.round(protGramos);
  grasaGramos = Math.round(grasaGramos);

  const comidaQuery = await pool.query(`SELECT * FROM catalogo_comida`);
  const alimentos = comidaQuery.rows;

  const proteinas    = alimentos.filter(a => a.grupo_nutricional.toUpperCase() === 'AOA');
  const guarniciones = alimentos.filter(a => ['cereales', 'leguminosas'].some(g => a.grupo_nutricional.toLowerCase().includes(g)));
  const frescos      = alimentos.filter(a => ['fruta', 'verdura'].some(g => a.grupo_nutricional.toLowerCase().includes(g)));

  const rand = arr => arr[Math.floor(Math.random() * arr.length)];

  const armarComida = (nombre, pct) => {
    const kcal = Math.round(caloriasMeta * pct);
    const pro  = rand(proteinas);
    const carb = rand(guarniciones);
    const fres = rand(frescos);
    return {
      tiempo: nombre,
      calorias: kcal,
      proteina: `${pro.nombre} (${((kcal * 0.35 / pro.calorias_kcal) * pro.cantidad_base).toFixed(1)} ${pro.unidad_medida})`,
      guarnicion: `${carb.nombre} (${((kcal * 0.40 / carb.calorias_kcal) * carb.cantidad_base).toFixed(1)} ${carb.unidad_medida})`,
      fresco: `${fres.nombre} (${((kcal * 0.25 / fres.calorias_kcal) * fres.cantidad_base).toFixed(1)} ${fres.unidad_medida})`
    };
  };

  return {
    tipoDieta,
    caloriasMeta,
    macros: { proteina: protGramos, carbohidratos: carbGramos, grasas: grasaGramos },
    comidas: [
      armarComida('🌅 Desayuno', 0.30),
      armarComida('🍲 Comida', 0.40),
      armarComida('🌙 Cena', 0.30)
    ]
  };
}

// ═══════════════════════════════════════════════════
// 📋 DECLARACIÓN DE TOOLS PARA GEMINI
// ═══════════════════════════════════════════════════

const tools = [{
  functionDeclarations: [
    {
      name: 'buscarAlimentos',
      description: 'Busca alimentos del catálogo SMAE por grupo nutricional y calorías máximas',
      parameters: {
        type: 'OBJECT',
        properties: {
          grupo_nutricional: { type: 'STRING', description: 'Grupo: Frutas, Verduras, Cereales, AOA, Lácteos, Leguminosas, Grasas' },
          calorias_max:      { type: 'INTEGER', description: 'Calorías máximas por porción' }
        }
      }
    },
    {
        name: 'buscarEjercicios',
        description: 'Busca ejercicios del catálogo por grupo muscular. Automáticamente ajusta la cantidad según el nivel del usuario y las repeticiones según su objetivo. SIEMPRE pasa id_usuario para personalizar.',
        parameters: {
          type: 'OBJECT',
          properties: {
            grupo_muscular: { 
              type: 'STRING', 
              description: 'Grupo muscular: Pecho, Espalda, Bíceps, Tríceps, Piernas, Hombros, Abdomen, Antebrazos. Si el usuario no especifica, usa el más relevante para su objetivo.' 
            },
            id_usuario: { 
              type: 'INTEGER', 
              description: 'ID del usuario — siempre requerido para personalizar cantidad y repeticiones' 
            }
          },
          required: ['id_usuario']
        }
      },
    {
      name: 'obtenerPerfilUsuario',
      description: 'Obtiene el perfil de salud del usuario: peso, altura, TMB, objetivo y condiciones médicas. Úsala cuando el usuario pregunte por sus datos, perfil o quiera saber su información.',
      parameters: {
        type: 'OBJECT',
        properties: {
          id_usuario: { type: 'INTEGER', description: 'ID del usuario (ya lo tienes en el contexto, no lo pidas)' }
        },
        required: ['id_usuario']
      }
    },
    {
      name: 'obtenerConsumoHoy',
      description: 'Obtiene los alimentos consumidos hoy por el usuario y el total de calorías del día',
      parameters: {
        type: 'OBJECT',
        properties: {
          id_usuario: { type: 'INTEGER', description: 'ID del usuario (ya lo tienes en el contexto, no lo pidas)' }
        },
        required: ['id_usuario']
      }
    },
    {
      name: 'actualizarPeso',
      description: 'Actualiza el peso del usuario en su historial. Úsala cuando el usuario diga su nuevo peso.',
      parameters: {
        type: 'OBJECT',
        properties: {
          id_usuario:  { type: 'INTEGER', description: 'ID del usuario (ya lo tienes en el contexto, no lo pidas)' },
          nuevo_peso:  { type: 'NUMBER',  description: 'Nuevo peso en kilogramos que el usuario indicó' }
        },
        required: ['id_usuario', 'nuevo_peso']
      }
    },
    {
      name: 'generarDietaCompleta',
      description: 'Genera un plan de dieta personalizado con macros y menú del día basado en el perfil del usuario',
      parameters: {
        type: 'OBJECT',
        properties: {
          id_usuario: { type: 'INTEGER', description: 'ID del usuario (ya lo tienes en el contexto, no lo pidas)' }
        },
        required: ['id_usuario']
      }
    }
  ]
}];

// Mapa de funciones ejecutables
const funcionesDisponibles = {
  buscarAlimentos,
  buscarEjercicios,
  obtenerPerfilUsuario,
  obtenerConsumoHoy,
  actualizarPeso,
  generarDietaCompleta
};

// Funciones que necesitan id_usuario inyectado automáticamente
const funcionesConUsuario = [
  'obtenerPerfilUsuario',
  'obtenerConsumoHoy',
  'actualizarPeso',
  'generarDietaCompleta',
  'buscarEjercicios'
];

// ═══════════════════════════════════════════════════
// 🚀 CONTROLADOR PRINCIPAL
// ═══════════════════════════════════════════════════
// ═══════════════════════════════════════════════════
// 🔄 HELPER: Reintento automático para errores 503
// ═══════════════════════════════════════════════════
async function llamarGeminiConReintento(payload, intentos = 3, espera = 1500) {
  for (let i = 1; i <= intentos; i++) {
    try {
      return await ai.models.generateContent(payload);
    } catch (error) {
      const es503 = error?.status === 503 || error?.message?.includes('UNAVAILABLE');
      const esTimeout = error?.message?.includes('UND_ERR') || error?.message?.includes('fetch failed');

      if ((es503 || esTimeout) && i < intentos) {
        console.log(`⚠️ Reintento ${i}/${intentos} en ${espera / 1000}s...`);
        await new Promise(r => setTimeout(r, espera));
        espera *= 1.3; // backoff más suave: 1.5s → 2s → 2.6s
      } else {
        throw error;
      }
    }
  }
}

const enviarMensaje = async (req, res) => {
  try {
    const { message, historial = [] } = req.body;
    const userId = req.body.userId;

    // System prompt con userId inyectado — Gemini nunca necesita pedírselo al usuario
    const SYSTEM_PROMPT = `Eres el Asistente Inteligente de NutriLife, una app de nutrición y ejercicio personalizado, desarrollada con la colaboración del Entrenador Personal certificado MARTÍNEZ ESPINOSA CARLOS JOSUÉ.

RESTRICCIONES ESTRICTAS:
- SOLO puedes responder sobre: nutrición, dietas, alimentos, calorías, macros, ejercicio, rutinas, peso, salud física y funciones de NutriLife.
- Si el usuario pregunta cualquier otra cosa (tecnología, política, entretenimiento, etc.), responde EXACTAMENTE: "Solo puedo ayudarte con temas de nutrición, ejercicio y tu progreso en NutriLife. 🍏 ¿En qué te ayudo hoy?"

REGLAS DE DATOS — MUY IMPORTANTE:
- Cuando des ejemplos de alimentos concretos, SIEMPRE usa buscarAlimentos() para obtenerlos de tu catálogo real basado en el Sistema Mexicano de Equivalencias (SMAE). NUNCA inventes alimentos.
- Cuando des ejercicios concretos, SIEMPRE usa buscarEjercicios() para obtenerlos de tu catálogo real validado por el Entrenador MARTÍNEZ ESPINOSA CARLOS JOSUÉ. NUNCA inventes ejercicios.
- Puedes explicar conceptos generales de nutrición y entrenamiento con tu conocimiento (eso está bien), pero en cuanto des ejemplos concretos de qué comer o qué ejercicio hacer, deben venir de la BD.

CUANDO TE PREGUNTEN "¿en qué te basas?" O "¿cuáles son tus fuentes?":
- Responde que los planes nutricionales están basados en el Sistema Mexicano de Equivalencias Alimentarias (SMAE) registrado en el catálogo de NutriLife.
- Responde que las rutinas de ejercicio fueron diseñadas y validadas por el Entrenador Personal MARTÍNEZ ESPINOSA CARLOS JOSUÉ, colaborador del proyecto NutriLife.
- Ofrece mostrar alimentos o ejercicios reales del catálogo.

CONTEXTO DE SESIÓN:
- El ID del usuario autenticado es: ${userId}
- NUNCA le pidas al usuario su ID. Ya lo tienes. Úsalo directamente en las funciones.
- Cuando el usuario pida su dieta, usa generarDietaCompleta() directamente.
- Cuando el usuario quiera actualizar su peso, pregunta el valor y llama actualizarPeso().
- Responde siempre en español, de forma amigable y motivadora. Usa emojis con moderación.`;

    const mensajes = [
      ...historial,
      { role: 'user', parts: [{ text: message }] }
    ];

    let response = await llamarGeminiConReintento({
    model: 'gemini-3.5-flash',
    contents: mensajes,
    config: { systemInstruction: SYSTEM_PROMPT, tools }
    });

    // 🔄 Loop de function calling
    while (response.functionCalls?.length > 0) {
      const call = response.functionCalls[0];
      let args = { ...call.args };

      // Inyectar id_usuario automáticamente
      if (funcionesConUsuario.includes(call.name)) {
        args.id_usuario = Number(userId);
      }

      console.log(`🔧 Gemini llamó: ${call.name}`, args);
      const resultado = await funcionesDisponibles[call.name](args);

      mensajes.push({ role: 'model', parts: response.candidates[0].content.parts });
      mensajes.push({
        role: 'user',
        parts: [{ functionResponse: { name: call.name, response: { result: resultado } } }]
      });

      response = await llamarGeminiConReintento({
        model: 'gemini-3.5-flash',
        contents: mensajes,
        config: { systemInstruction: SYSTEM_PROMPT, tools }
        });
    }

    res.json({ reply: response.text });

  } catch (error) {
  console.error('❌ Error en chatbot:', error);

  const es503 = error?.status === 503 || error?.message?.includes('UNAVAILABLE');
  const mensaje = es503
    ? 'El asistente está procesando tu petición , por favor espere unos segundos. 🙏'
    : 'Error al procesar tu mensaje. Intenta de nuevo.';

  res.status(503).json({ error: mensaje });
}
};
const manejarWebhook = async (req, res) => {
  res.json({
    fulfillmentResponse: {
      messages: [{ text: { text: ['OK'] } }],
    },
  });
};


module.exports = { enviarMensaje };
