// server/controllers/chatbotController.js
const { GoogleGenAI } = require('@google/genai');
const pool = require('../config/db');

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

// ═══════════════════════════════════════════════════
// 🔧 FUNCIONES EXISTENTES (sin cambios)
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

async function listarCatalogoEjercicios({ id_usuario }) {
  const result = await pool.query(
    `SELECT nombre, grupo_muscular, dificultad, series_sugeridas, repeticiones_sugeridas, descripcion, objetivo_enfocado, img_url
     FROM cat_ejercicios
     ORDER BY grupo_muscular ASC, nombre ASC`
  );

  const agrupado = {};
  for (const ej of result.rows) {
    const grupo = ej.grupo_muscular || 'Sin grupo';
    if (!agrupado[grupo]) agrupado[grupo] = [];
    agrupado[grupo].push(ej);
  }

  return { total: result.rows.length, grupos: agrupado };
}

async function buscarEjercicios({ grupo_muscular, id_usuario }) {
  const perfil = await pool.query(
    `SELECT nivel_actividad, objetivo_actual FROM historial_medidas
     WHERE id_usuario = $1 ORDER BY fecha_registro DESC LIMIT 1`,
    [id_usuario]
  );

  let cantidadEjercicios = 2;
  let repSugeridas = null;

  if (perfil.rows.length > 0) {
    const nivel    = perfil.rows[0].nivel_actividad?.toLowerCase() || '';
    const objetivo = perfil.rows[0].objetivo_actual?.toLowerCase() || '';

    if (nivel.includes('avanzado') || nivel.includes('intenso')) {
      cantidadEjercicios = 4;
    } else if (nivel.includes('intermedio') || nivel.includes('moderado')) {
      cantidadEjercicios = 3;
    } else {
      cantidadEjercicios = 2;
    }

    if (objetivo.includes('perder') || objetivo.includes('bajar') || objetivo.includes('grasa')) {
      repSugeridas = '15-20';
    } else if (objetivo.includes('ganar') || objetivo.includes('volumen') || objetivo.includes('masa')) {
      repSugeridas = '6-10';
    } else {
      repSugeridas = '10-15';
    }
  }

  const conditions = [];
  const params = [];

  if (grupo_muscular) {
    conditions.push(`grupo_muscular ILIKE $${params.length + 1}`);
    params.push(`%${grupo_muscular}%`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const result = await pool.query(
    `SELECT nombre, grupo_muscular, series_sugeridas, repeticiones_sugeridas, descripcion, objetivo_enfocado, img_url
     FROM cat_ejercicios ${where} ORDER BY RANDOM() LIMIT $${params.length + 1}`,
    [...params, cantidadEjercicios]
  );

  return {
    ejercicios: result.rows,
    perfil_aplicado: { cantidad: cantidadEjercicios, repeticiones_recomendadas: repSugeridas }
  };
}

async function obtenerPerfilUsuario({ id_usuario }) {
  const medidas = await pool.query(
    `SELECT peso_kg, altura_cm, nivel_actividad, tmb_calculado, objetivo_actual
     FROM historial_medidas WHERE id_usuario = $1 ORDER BY fecha_registro DESC LIMIT 1`,
    [id_usuario]
  );
  const triaje = await pool.query(
    `SELECT padece_enfermedad, enfermedades_declaradas, apto_alto_impacto, fenotipo, tipo_split
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

async function guardarEvaluacion({ id_usuario, edad, peso_kg, altura_cm, nivel_actividad, objetivo }) {
  let tmb = (10 * peso_kg) + (6.25 * altura_cm) - (5 * edad) + 5;

  const multiplicadores = {
    'sedentario': 1.2,
    'ligero': 1.375,
    'moderado': 1.55,
    'intenso': 1.725
  };

  const mult = multiplicadores[nivel_actividad.toLowerCase()] || 1.55;
  let metaCalorica = Math.round(tmb * mult);

  if (objetivo.toLowerCase().includes('perder')) metaCalorica -= 500;
  else if (objetivo.toLowerCase().includes('ganar')) metaCalorica += 400;

  await pool.query(
    `INSERT INTO historial_medidas
     (id_usuario, peso_kg, altura_cm, nivel_actividad, tmb_calculado, objetivo_actual)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [id_usuario, peso_kg, altura_cm, nivel_actividad, metaCalorica, objetivo]
  );

  return {
    success: true,
    tmb: metaCalorica,
    mensaje: `¡Evaluación completada! Tu meta calórica diaria es ${metaCalorica} kcal para ${objetivo}. 🎯`
  };
}

async function generarDietaCompleta({ id_usuario }) {
  const userQuery = await pool.query(
    `SELECT tmb_calculado, objetivo_actual, peso_kg FROM historial_medidas
     WHERE id_usuario = $1 ORDER BY fecha_registro DESC LIMIT 1`,
    [id_usuario]
  );

  if (userQuery.rows.length === 0) {
    return { error: 'No encontré tu evaluación previa. Escribe evaluación para empezar.' };
  }

  const { tmb_calculado, objetivo_actual, peso_kg } = userQuery.rows[0];
  const caloriasMeta = Number(tmb_calculado);
  const objLimpio = objetivo_actual.toLowerCase();

  let protGramos, grasaGramos, tipoDieta;
  if (objLimpio.includes('perder') || objLimpio.includes('grasa')) {
    tipoDieta = 'Definición 🔥'; protGramos = peso_kg * 2.2; grasaGramos = peso_kg * 0.8;
  } else if (objLimpio.includes('ganar') || objLimpio.includes('masa')) {
    tipoDieta = 'Volumen 📈'; protGramos = peso_kg * 2.0; grasaGramos = peso_kg * 1.0;
  } else {
    tipoDieta = 'Mantenimiento ⚖️'; protGramos = peso_kg * 1.8; grasaGramos = peso_kg * 1.0;
  }

  const carbGramos = Math.round((caloriasMeta - (protGramos * 4) - (grasaGramos * 9)) / 4);
  protGramos  = Math.round(protGramos);
  grasaGramos = Math.round(grasaGramos);

  const alimentos    = (await pool.query(`SELECT * FROM catalogo_comida`)).rows;
  const proteinas    = alimentos.filter(a => a.grupo_nutricional.toUpperCase() === 'AOA');
  const guarniciones = alimentos.filter(a => ['cereales','leguminosas'].some(g => a.grupo_nutricional.toLowerCase().includes(g)));
  const frescos      = alimentos.filter(a => ['fruta','verdura'].some(g => a.grupo_nutricional.toLowerCase().includes(g)));
  const rand         = arr => arr[Math.floor(Math.random() * arr.length)];

  const momentos = [
    { nombre: 'Desayuno', pct: 0.30 },
    { nombre: 'Comida',   pct: 0.40 },
    { nombre: 'Cena',     pct: 0.30 },
  ];

  const comidas = [];

  for (const momento of momentos) {
    const kcal = Math.round(caloriasMeta * momento.pct);
    const pro  = rand(proteinas);
    const carb = rand(guarniciones);
    const fres = rand(frescos);

    const porPro  = parseFloat((kcal * 0.35 / pro.calorias_kcal).toFixed(2));
    const porCarb = parseFloat((kcal * 0.40 / carb.calorias_kcal).toFixed(2));
    const porFres = parseFloat((kcal * 0.25 / fres.calorias_kcal).toFixed(2));

    await pool.query(
      `INSERT INTO dieta_diaria
         (id_usuario, momento_dia, id_alimento_proteina, id_alimento_guarnicion, id_alimento_fresco,
          porciones_proteina, porciones_guarnicion, porciones_fresco, fecha)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,CURRENT_DATE)
       ON CONFLICT (id_usuario, momento_dia, fecha)
       DO UPDATE SET
         id_alimento_proteina   = EXCLUDED.id_alimento_proteina,
         id_alimento_guarnicion = EXCLUDED.id_alimento_guarnicion,
         id_alimento_fresco     = EXCLUDED.id_alimento_fresco,
         porciones_proteina     = EXCLUDED.porciones_proteina,
         porciones_guarnicion   = EXCLUDED.porciones_guarnicion,
         porciones_fresco       = EXCLUDED.porciones_fresco`,
      [id_usuario, momento.nombre,
       pro.id_comida, carb.id_comida, fres.id_comida,
       porPro, porCarb, porFres]
    );

    comidas.push({
      tiempo: momento.nombre,
      calorias: kcal,
      proteina:   `${pro.nombre} (${porPro} ${pro.unidad_medida})`,
      guarnicion: `${carb.nombre} (${porCarb} ${carb.unidad_medida})`,
      fresco:     `${fres.nombre} (${porFres} ${fres.unidad_medida})`,
    });
  }

  return {
    tipoDieta, caloriasMeta,
    macros: { proteina: protGramos, carbohidratos: carbGramos, grasas: grasaGramos },
    comidas,
  };
}

// ═══════════════════════════════════════════════════
// 🆕 FUNCIONES NUEVAS — Planes personalizados
// ═══════════════════════════════════════════════════

// ── Helper: ajuste calórico según fenotipo ───────────
function ajusteFenotipo(fenotipo) {
  const f = (fenotipo || '').toLowerCase();
  if (f.includes('endo')) return -400;   // endomorfo: déficit
  if (f.includes('ecto')) return +400;   // ectomorfo: superávit
  return 0;                              // mesomorfo: mantenimiento
}

// ── Estructura de días según split ───────────────────
const SPLITS = {
  'PPL': [
    { nombre: 'Empuje',   musculosObj: ['Pecho', 'Hombros', 'Tríceps'] },
    { nombre: 'Jalón',    musculosObj: ['Espalda', 'Bíceps', 'Antebrazos'] },
    { nombre: 'Piernas',  musculosObj: ['Piernas', 'Abdomen'] },
    { nombre: 'Empuje',   musculosObj: ['Pecho', 'Hombros', 'Tríceps'] },
    { nombre: 'Jalón',    musculosObj: ['Espalda', 'Bíceps', 'Antebrazos'] },
    { nombre: 'Piernas',  musculosObj: ['Piernas', 'Abdomen'] },
    { nombre: 'Descanso', musculosObj: [] },
  ],
  'Arnold': [
    { nombre: 'Pecho + Espalda',    musculosObj: ['Pecho', 'Espalda'] },
    { nombre: 'Hombros + Brazos',   musculosObj: ['Hombros', 'Bíceps', 'Tríceps'] },
    { nombre: 'Piernas + Abdomen',  musculosObj: ['Piernas', 'Abdomen'] },
    { nombre: 'Pecho + Espalda',    musculosObj: ['Pecho', 'Espalda'] },
    { nombre: 'Hombros + Brazos',   musculosObj: ['Hombros', 'Bíceps', 'Tríceps'] },
    { nombre: 'Piernas + Abdomen',  musculosObj: ['Piernas', 'Abdomen'] },
    { nombre: 'Descanso',           musculosObj: [] },
  ],
  'Upper/Lower': [
    { nombre: 'Tren Superior A',  musculosObj: ['Pecho', 'Espalda', 'Hombros'] },
    { nombre: 'Tren Inferior A',  musculosObj: ['Piernas', 'Abdomen'] },
    { nombre: 'Descanso',         musculosObj: [] },
    { nombre: 'Tren Superior B',  musculosObj: ['Pecho', 'Bíceps', 'Tríceps'] },
    { nombre: 'Tren Inferior B',  musculosObj: ['Piernas', 'Abdomen'] },
    { nombre: 'Descanso',         musculosObj: [] },
    { nombre: 'Descanso',         musculosObj: [] },
  ],
  'Bro Split': [
    { nombre: 'Pecho',    musculosObj: ['Pecho'] },
    { nombre: 'Espalda',  musculosObj: ['Espalda'] },
    { nombre: 'Hombros',  musculosObj: ['Hombros'] },
    { nombre: 'Brazos',   musculosObj: ['Bíceps', 'Tríceps', 'Antebrazos'] },
    { nombre: 'Piernas',  musculosObj: ['Piernas', 'Abdomen'] },
    { nombre: 'Descanso', musculosObj: [] },
    { nombre: 'Descanso', musculosObj: [] },
  ],
  'Full Body': [
    { nombre: 'Full Body A', musculosObj: ['Pecho', 'Espalda', 'Piernas'] },
    { nombre: 'Descanso',    musculosObj: [] },
    { nombre: 'Full Body B', musculosObj: ['Hombros', 'Bíceps', 'Tríceps', 'Piernas'] },
    { nombre: 'Descanso',    musculosObj: [] },
    { nombre: 'Full Body C', musculosObj: ['Espalda', 'Pecho', 'Abdomen', 'Piernas'] },
    { nombre: 'Descanso',    musculosObj: [] },
    { nombre: 'Descanso',    musculosObj: [] },
  ],
};

// ── 1. elegirSplit ────────────────────────────────────
async function elegirSplit({ id_usuario, tipo_split }) {
  const splitValidos = Object.keys(SPLITS);
  if (!splitValidos.includes(tipo_split)) {
    return {
      error: `Split no válido. Opciones: ${splitValidos.join(', ')}`,
      opciones: splitValidos
    };
  }

  // Guardar el split elegido en el perfil de salud
  await pool.query(
    `UPDATE perfil_salud_triaje SET tipo_split = $1 WHERE id_usuario = $2`,
    [tipo_split, id_usuario]
  );

  // Obtener datos del usuario para generar la rutina
  const [medidas, triaje] = await Promise.all([
    pool.query(
      `SELECT peso_kg, objetivo_actual, nivel_actividad FROM historial_medidas
       WHERE id_usuario = $1 ORDER BY fecha_registro DESC LIMIT 1`,
      [id_usuario]
    ),
    pool.query(
      `SELECT fenotipo FROM perfil_salud_triaje WHERE id_usuario = $1`,
      [id_usuario]
    )
  ]);

  const objetivo = medidas.rows[0]?.objetivo_actual?.toLowerCase() || 'mantenerse';
  const fenotipo = triaje.rows[0]?.fenotipo || 'mesomorfo';

  // Determinar reps según objetivo
  let repsTarget;
  if (objetivo.includes('perder') || objetivo.includes('grasa')) repsTarget = '15-20';
  else if (objetivo.includes('ganar') || objetivo.includes('masa')) repsTarget = '6-10';
  else repsTarget = '10-12';

  // Obtener ejercicios del catálogo
  const catEjercicios = await pool.query(
    `SELECT nombre, grupo_muscular, series_sugeridas, repeticiones_sugeridas, descripcion, img_url
     FROM cat_ejercicios ORDER BY grupo_muscular, nombre`
  );

  // Agrupar ejercicios por músculo para acceso rápido
  const porMusculo = {};
  for (const ej of catEjercicios.rows) {
    const g = ej.grupo_muscular;
    if (!porMusculo[g]) porMusculo[g] = [];
    porMusculo[g].push(ej);
  }

  const rand = arr => arr[Math.floor(Math.random() * arr.length)];

  // Generar 28 días (4 semanas) rotando el patrón del split
  const diasSplit = SPLITS[tipo_split];
  const rutinaJson = {};

  for (let dia = 1; dia <= 28; dia++) {
    const patron = diasSplit[(dia - 1) % diasSplit.length];

    if (patron.nombre === 'Descanso' || patron.musculosObj.length === 0) {
      rutinaJson[dia] = { nombre: 'Descanso', ejercicios: [] };
      continue;
    }

    const ejercicios = [];
    for (const musculo of patron.musculosObj) {
      const disponibles = porMusculo[musculo] || [];
      if (disponibles.length === 0) continue;
      // 2 ejercicios por grupo muscular, sin repetir si hay suficientes
      const elegidos = disponibles.sort(() => Math.random() - 0.5).slice(0, 2);
      for (const ej of elegidos) {
        ejercicios.push({
          nombre:      ej.nombre,
          musculo:     ej.grupo_muscular,
          series:      ej.series_sugeridas || 3,
          repeticiones: repsTarget,
          descripcion: ej.descripcion || '',
          img_url:     ej.img_url || null
        });
      }
    }

    rutinaJson[dia] = { nombre: patron.nombre, ejercicios };
  }

  // Guardar en BD (ON CONFLICT reemplaza si ya existía)
  const ahora = new Date();
  const anio  = ahora.getFullYear();
  const mes   = ahora.getMonth() + 1;

  await pool.query(
    `INSERT INTO plan_rutina_mensual (id_usuario, anio, mes, tipo_split, fenotipo, rutina_json)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (id_usuario, anio, mes) DO UPDATE SET
       tipo_split   = EXCLUDED.tipo_split,
       fenotipo     = EXCLUDED.fenotipo,
       rutina_json  = EXCLUDED.rutina_json,
       generado_en  = NOW()`,
    [id_usuario, anio, mes, tipo_split, fenotipo, JSON.stringify(rutinaJson)]
  );

  return {
    __tipo: 'split_confirmado',
    success: true,
    tipo_split,
    fenotipo,
    mensaje: `¡Listo! Tu rutina de ${tipo_split} (28 días) fue generada y guardada. 💪`,
    dias_generados: 28,
    preview_dia1: rutinaJson[1]
  };
}

// ── 2. obtenerRutinaHoy ───────────────────────────────
async function obtenerRutinaHoy({ id_usuario }) {
  const ahora = new Date();
  const anio  = ahora.getFullYear();
  const mes   = ahora.getMonth() + 1;

  // Buscar rutina del mes actual
  const rutinaQ = await pool.query(
    `SELECT rutina_json, tipo_split, fenotipo, generado_en
     FROM plan_rutina_mensual
     WHERE id_usuario = $1 AND anio = $2 AND mes = $3`,
    [id_usuario, anio, mes]
  );

  if (rutinaQ.rows.length === 0) {
    // Ver si tiene split guardado para sugerirlo
    const splitQ = await pool.query(
      `SELECT tipo_split FROM perfil_salud_triaje WHERE id_usuario = $1`,
      [id_usuario]
    );
    const splitGuardado = splitQ.rows[0]?.tipo_split;

    return {
      __tipo: 'pedir_split',
      error: 'No tienes rutina para este mes.',
      sugerencia: splitGuardado
        ? `Tu último split fue "${splitGuardado}". ¿Quieres generarlo de nuevo?`
        : 'Elige un split para generar tu rutina mensual. Opciones: PPL, Arnold, Upper/Lower, Bro Split, Full Body.',
      pedir_split: true
    };
  }

  // Calcular qué día del mes es hoy (1-28)
  const diaDelMes = ahora.getDate();
  const diaRutina = ((diaDelMes - 1) % 28) + 1;

  const rutina      = rutinaQ.rows[0].rutina_json;
  const diaHoy      = rutina[diaRutina.toString()];
  const tipoSplit   = rutinaQ.rows[0].tipo_split;
  const fenotipo    = rutinaQ.rows[0].fenotipo;

  // Enriquecer ejercicios con img_url desde catálogo (por si la rutina fue
  // generada antes de agregar la columna)
  let ejerciciosEnriquecidos = diaHoy?.ejercicios || [];
  if (ejerciciosEnriquecidos.length > 0) {
    const nombres = ejerciciosEnriquecidos.map(e => e.nombre);
    const imgQ = await pool.query(
      `SELECT nombre, img_url FROM cat_ejercicios WHERE nombre = ANY($1)`,
      [nombres]
    );
    const imgMap = {};
    for (const row of imgQ.rows) imgMap[row.nombre] = row.img_url;
    ejerciciosEnriquecidos = ejerciciosEnriquecidos.map(e => ({
      ...e,
      img_url: e.img_url || imgMap[e.nombre] || null
    }));
  }

  return {
    __tipo: 'rutina',
    tipo_split: tipoSplit,
    fenotipo,
    dia_del_mes: diaRutina,
    semana: Math.ceil(diaRutina / 7),
    dia_nombre: diaHoy?.nombre || 'Descanso',
    ejercicios: ejerciciosEnriquecidos,
    es_descanso: !diaHoy?.ejercicios?.length
  };
}

// ── 3. obtenerDietaSemana ─────────────────────────────
async function obtenerDietaSemana({ id_usuario }) {
  const ahora = new Date();

  // Calcular semana ISO
  const startOfYear = new Date(ahora.getFullYear(), 0, 1);
  const semanaISO   = Math.ceil(((ahora - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
  const anio        = ahora.getFullYear();

  // Buscar dieta de esta semana
  const dietaQ = await pool.query(
    `SELECT dieta_json, calorias_objetivo, fenotipo FROM plan_dieta_semanal
     WHERE id_usuario = $1 AND anio = $2 AND semana_iso = $3`,
    [id_usuario, anio, semanaISO]
  );

  // Buscar overrides del día de hoy
  const hoy = ahora.toISOString().split('T')[0];
  const overridesQ = await pool.query(
    `SELECT momento_dia, comida_json FROM cambios_dieta_dia
     WHERE id_usuario = $1 AND fecha = $2`,
    [id_usuario, hoy]
  );

  let dietaBase;
  let caloriasMeta;
  let fenotipo;
  let generada = false;

  if (dietaQ.rows.length > 0) {
    dietaBase    = dietaQ.rows[0].dieta_json;
    caloriasMeta = dietaQ.rows[0].calorias_objetivo;
    fenotipo     = dietaQ.rows[0].fenotipo;
  } else {
    // Generar dieta nueva basada en TDEE + fenotipo
    const [medidasQ, triajeQ] = await Promise.all([
      pool.query(
        `SELECT tmb_calculado, objetivo_actual, peso_kg FROM historial_medidas
         WHERE id_usuario = $1 ORDER BY fecha_registro DESC LIMIT 1`,
        [id_usuario]
      ),
      pool.query(
        `SELECT fenotipo FROM perfil_salud_triaje WHERE id_usuario = $1`,
        [id_usuario]
      )
    ]);

    if (medidasQ.rows.length === 0) {
      return { error: 'No tienes evaluación física. Primero completa tu evaluación.' };
    }

    const { tmb_calculado, objetivo_actual, peso_kg } = medidasQ.rows[0];
    fenotipo     = triajeQ.rows[0]?.fenotipo || 'mesomorfo';
    caloriasMeta = Number(tmb_calculado) + ajusteFenotipo(fenotipo);

    // Generar 3 comidas del catálogo
    const alimentos    = (await pool.query(`SELECT * FROM catalogo_comida`)).rows;
    const proteinas    = alimentos.filter(a => a.grupo_nutricional.toUpperCase() === 'AOA');
    const guarniciones = alimentos.filter(a => ['cereales','leguminosas'].some(g => a.grupo_nutricional.toLowerCase().includes(g)));
    const frescos      = alimentos.filter(a => ['fruta','verdura'].some(g => a.grupo_nutricional.toLowerCase().includes(g)));
    const rand         = arr => arr[Math.floor(Math.random() * arr.length)];

    const momentos = [
      { nombre: 'Desayuno', icon: '🌅', hora: '7:30 AM', pct: 0.30 },
      { nombre: 'Comida',   icon: '☀️', hora: '1:30 PM', pct: 0.40 },
      { nombre: 'Cena',     icon: '🌙', hora: '8:00 PM', pct: 0.30 },
    ];

    dietaBase = {};
    for (const momento of momentos) {
      const kcal = Math.round(caloriasMeta * momento.pct);
      const pro  = rand(proteinas);
      const carb = rand(guarniciones);
      const fres = rand(frescos);

      const porPro  = parseFloat((kcal * 0.35 / pro.calorias_kcal).toFixed(2));
      const porCarb = parseFloat((kcal * 0.40 / carb.calorias_kcal).toFixed(2));
      const porFres = parseFloat((kcal * 0.25 / fres.calorias_kcal).toFixed(2));

      dietaBase[momento.nombre] = {
        icon:        momento.icon,
        hora:        momento.hora,
        kcal,
        nombre:      `${pro.nombre} + ${carb.nombre}`,
        descripcion: `${porPro} ${pro.unidad_medida} ${pro.nombre} · ${porCarb} ${carb.unidad_medida} ${carb.nombre} · ${porFres} ${fres.unidad_medida} ${fres.nombre}`,
        alimentos: [
          { id: pro.id_comida,  nombre: pro.nombre,  porciones: porPro,  unidad: pro.unidad_medida,  tipo: 'proteina'   },
          { id: carb.id_comida, nombre: carb.nombre, porciones: porCarb, unidad: carb.unidad_medida, tipo: 'guarnicion' },
          { id: fres.id_comida, nombre: fres.nombre, porciones: porFres, unidad: fres.unidad_medida, tipo: 'fresco'     },
        ]
      };
    }

    // Guardar la dieta semanal nueva
    await pool.query(
      `INSERT INTO plan_dieta_semanal (id_usuario, anio, semana_iso, fenotipo, calorias_objetivo, dieta_json)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id_usuario, anio, semana_iso) DO UPDATE SET
         fenotipo          = EXCLUDED.fenotipo,
         calorias_objetivo = EXCLUDED.calorias_objetivo,
         dieta_json        = EXCLUDED.dieta_json,
         generado_en       = NOW()`,
      [id_usuario, anio, semanaISO, fenotipo, caloriasMeta, JSON.stringify(dietaBase)]
    );

    generada = true;
  }

  // Aplicar overrides del día
  const overrides = {};
  for (const ov of overridesQ.rows) {
    overrides[ov.momento_dia] = ov.comida_json;
  }

  const dietaHoy = { ...dietaBase };
  for (const [momento, comida] of Object.entries(overrides)) {
    dietaHoy[momento] = { ...dietaHoy[momento], ...comida, _override: true };
  }

  // Calcular macros totales aproximados
  const totalKcal = Object.values(dietaHoy).reduce((s, c) => s + (c.kcal || 0), 0);

  return {
    __tipo: 'dieta',
    fenotipo,
    ajuste_fenotipo: ajusteFenotipo(fenotipo),
    calorias_objetivo: caloriasMeta,
    total_kcal_hoy: totalKcal,
    dieta: dietaHoy,
    tiene_cambios_hoy: Object.keys(overrides).length > 0,
    semana_iso: semanaISO,
    recien_generada: generada
  };
}

// ── 4. cambiarComidaHoy ───────────────────────────────
async function cambiarComidaHoy({ id_usuario, momento_dia, nuevo_alimento_nombre }) {
  // Buscar el alimento en el catálogo
  const alimentoQ = await pool.query(
    `SELECT id_comida, nombre, grupo_nutricional, calorias_kcal, proteina_g, lipidos_g,
            carbohidratos_g, cantidad_base, unidad_medida
     FROM catalogo_comida
     WHERE nombre ILIKE $1
     LIMIT 1`,
    [`%${nuevo_alimento_nombre}%`]
  );

  if (alimentoQ.rows.length === 0) {
    // Buscar alternativas
    const alternativas = await pool.query(
      `SELECT nombre FROM catalogo_comida LIMIT 5`
    );
    return {
      error: `No encontré "${nuevo_alimento_nombre}" en el catálogo.`,
      sugerencias: alternativas.rows.map(r => r.nombre)
    };
  }

  const alimento = alimentoQ.rows[0];
  const hoy = new Date().toISOString().split('T')[0];

  // Determinar kcal del momento según el plan actual
  const planQ = await pool.query(
    `SELECT dieta_json FROM plan_dieta_semanal WHERE id_usuario = $1
     ORDER BY generado_en DESC LIMIT 1`,
    [id_usuario]
  );

  const kcalMomento = planQ.rows[0]?.dieta_json?.[momento_dia]?.kcal || 500;
  const porciones   = parseFloat((kcalMomento * 0.8 / alimento.calorias_kcal).toFixed(2));

  const comidaNueva = {
    nombre:      alimento.nombre,
    descripcion: `${porciones} ${alimento.unidad_medida} de ${alimento.nombre}`,
    kcal:        Math.round(alimento.calorias_kcal * porciones),
    alimentos: [{
      id:        alimento.id_comida,
      nombre:    alimento.nombre,
      porciones,
      unidad:    alimento.unidad_medida,
      tipo:      'sustituto'
    }]
  };

  // Guardar override
  await pool.query(
    `INSERT INTO cambios_dieta_dia (id_usuario, fecha, momento_dia, comida_json)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (id_usuario, fecha, momento_dia) DO UPDATE SET
       comida_json = EXCLUDED.comida_json,
       creado_en   = NOW()`,
    [id_usuario, hoy, momento_dia, JSON.stringify(comidaNueva)]
  );

  return {
    __tipo: 'cambio_confirmado',
    success: true,
    momento_dia,
    alimento_nuevo: alimento.nombre,
    kcal:           comidaNueva.kcal,
    mensaje: `¡Listo! Tu ${momento_dia.toLowerCase()} de hoy se cambió a ${alimento.nombre} (~${comidaNueva.kcal} kcal). 🔄`
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
      name: 'guardarEvaluacion',
      description: 'Guarda la evaluación inicial del usuario con sus datos físicos y calcula su TMB. Úsala cuando tengas todos los datos del usuario nuevo.',
      parameters: {
        type: 'OBJECT',
        properties: {
          id_usuario:       { type: 'INTEGER', description: 'ID del usuario' },
          edad:             { type: 'INTEGER', description: 'Edad en años' },
          peso_kg:          { type: 'NUMBER',  description: 'Peso en kilogramos' },
          altura_cm:        { type: 'NUMBER',  description: 'Altura en centímetros' },
          nivel_actividad:  { type: 'STRING',  description: 'sedentario, ligero, moderado o intenso' },
          objetivo:         { type: 'STRING',  description: 'perder peso, ganar masa o mantenerse' }
        },
        required: ['id_usuario', 'edad', 'peso_kg', 'altura_cm', 'nivel_actividad', 'objetivo']
      }
    },
    {
      name: 'listarCatalogoEjercicios',
      description: 'Devuelve el catálogo COMPLETO de ejercicios disponibles en NutriLife, agrupados por grupo muscular. Úsala cuando el usuario pida ver todos los ejercicios o el catálogo completo.',
      parameters: {
        type: 'OBJECT',
        properties: {
          id_usuario: { type: 'INTEGER', description: 'ID del usuario' }
        },
        required: ['id_usuario']
      }
    },
    {
      name: 'buscarEjercicios',
      description: 'Busca ejercicios del catálogo por grupo muscular específico. Ajusta cantidad y repeticiones según el nivel y objetivo del usuario.',
      parameters: {
        type: 'OBJECT',
        properties: {
          grupo_muscular: {
            type: 'STRING',
            description: 'Grupo muscular: Pecho, Espalda, Bíceps, Tríceps, Piernas, Hombros, Abdomen, Antebrazos.'
          },
          id_usuario: { type: 'INTEGER', description: 'ID del usuario — siempre requerido para personalizar' }
        },
        required: ['id_usuario']
      }
    },
    {
      name: 'obtenerPerfilUsuario',
      description: 'Obtiene el perfil de salud del usuario: peso, altura, TMB, objetivo, fenotipo y split actual.',
      parameters: {
        type: 'OBJECT',
        properties: {
          id_usuario: { type: 'INTEGER', description: 'ID del usuario' }
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
          id_usuario: { type: 'INTEGER', description: 'ID del usuario' }
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
          id_usuario:  { type: 'INTEGER', description: 'ID del usuario' },
          nuevo_peso:  { type: 'NUMBER',  description: 'Nuevo peso en kilogramos' }
        },
        required: ['id_usuario', 'nuevo_peso']
      }
    },
    {
      name: 'generarDietaCompleta',
      description: 'Genera un plan de dieta para el día basado en el perfil del usuario. Usar solo cuando el usuario NO tenga plan semanal o pida una dieta nueva explícitamente.',
      parameters: {
        type: 'OBJECT',
        properties: {
          id_usuario: { type: 'INTEGER', description: 'ID del usuario' }
        },
        required: ['id_usuario']
      }
    },
    // ── NUEVAS ──
    {
      name: 'elegirSplit',
      description: 'Guarda el split de entrenamiento elegido por el usuario y genera su rutina mensual de 28 días. Úsala cuando el usuario elija o cambie su tipo de entrenamiento. Splits válidos: PPL, Arnold, Upper/Lower, Bro Split, Full Body.',
      parameters: {
        type: 'OBJECT',
        properties: {
          id_usuario:  { type: 'INTEGER', description: 'ID del usuario' },
          tipo_split:  { type: 'STRING',  description: 'PPL | Arnold | Upper/Lower | Bro Split | Full Body' }
        },
        required: ['id_usuario', 'tipo_split']
      }
    },
    {
      name: 'obtenerRutinaHoy',
      description: 'Obtiene la rutina de ejercicios de HOY del usuario basada en su plan mensual y el split elegido. Úsala cuando el usuario pida su rutina del día, su entrenamiento de hoy o qué ejercicios le tocan.',
      parameters: {
        type: 'OBJECT',
        properties: {
          id_usuario: { type: 'INTEGER', description: 'ID del usuario' }
        },
        required: ['id_usuario']
      }
    },
    {
      name: 'obtenerDietaSemana',
      description: 'Obtiene el plan de dieta de ESTA SEMANA del usuario (Lun-Dom). Si no existe, lo genera automáticamente con ajuste calórico según fenotipo. Úsala cuando el usuario pida su dieta, qué comer hoy o su plan nutricional.',
      parameters: {
        type: 'OBJECT',
        properties: {
          id_usuario: { type: 'INTEGER', description: 'ID del usuario' }
        },
        required: ['id_usuario']
      }
    },
    {
      name: 'cambiarComidaHoy',
      description: 'Cambia UNA comida (Desayuno, Comida o Cena) de HOY por un alimento diferente del catálogo. El cambio aplica solo para hoy, la dieta semanal base no se modifica.',
      parameters: {
        type: 'OBJECT',
        properties: {
          id_usuario:           { type: 'INTEGER', description: 'ID del usuario' },
          momento_dia:          { type: 'STRING',  description: 'Desayuno | Comida | Cena' },
          nuevo_alimento_nombre:{ type: 'STRING',  description: 'Nombre del alimento que quiere poner en ese momento' }
        },
        required: ['id_usuario', 'momento_dia', 'nuevo_alimento_nombre']
      }
    }
  ]
}];

// Mapa de funciones ejecutables
const funcionesDisponibles = {
  buscarAlimentos,
  listarCatalogoEjercicios,
  buscarEjercicios,
  obtenerPerfilUsuario,
  obtenerConsumoHoy,
  actualizarPeso,
  generarDietaCompleta,
  guardarEvaluacion,
  // Nuevas
  elegirSplit,
  obtenerRutinaHoy,
  obtenerDietaSemana,
  cambiarComidaHoy,
};

// Funciones que necesitan id_usuario inyectado automáticamente
const funcionesConUsuario = [
  'obtenerPerfilUsuario',
  'obtenerConsumoHoy',
  'actualizarPeso',
  'generarDietaCompleta',
  'guardarEvaluacion',
  'buscarEjercicios',
  'listarCatalogoEjercicios',
  'elegirSplit',
  'obtenerRutinaHoy',
  'obtenerDietaSemana',
  'cambiarComidaHoy',
];

// ═══════════════════════════════════════════════════
// 🔄 HELPER: Reintento automático para errores 503
// ═══════════════════════════════════════════════════
async function llamarGeminiConReintento(payload, intentos = 3, espera = 1500) {
  for (let i = 1; i <= intentos; i++) {
    try {
      return await ai.models.generateContent(payload);
    } catch (error) {
      const es503     = error?.status === 503 || error?.message?.includes('UNAVAILABLE');
      const esTimeout = error?.message?.includes('UND_ERR') || error?.message?.includes('fetch failed');

      if ((es503 || esTimeout) && i < intentos) {
        console.log(`⚠️ Reintento ${i}/${intentos} en ${espera / 1000}s...`);
        await new Promise(r => setTimeout(r, espera));
        espera *= 1.3;
      } else {
        throw error;
      }
    }
  }
}

// ═══════════════════════════════════════════════════
// 🚀 CONTROLADOR PRINCIPAL
// ═══════════════════════════════════════════════════
const enviarMensaje = async (req, res) => {
  try {
    const { message, historial = [] } = req.body;
    const userId = req.body.userId;

    const perfilExiste = await pool.query(
      `SELECT id_medida FROM historial_medidas WHERE id_usuario = $1 LIMIT 1`,
      [userId]
    );
    const esNuevoUsuario = perfilExiste.rows.length === 0;

    // Obtener fenotipo para incluirlo en el contexto del prompt
    const triajeQ = await pool.query(
      `SELECT fenotipo, tipo_split FROM perfil_salud_triaje WHERE id_usuario = $1`,
      [userId]
    );
    const fenotipo  = triajeQ.rows[0]?.fenotipo  || 'desconocido';
    const tipoSplit = triajeQ.rows[0]?.tipo_split || 'sin definir';

    const SYSTEM_PROMPT = `Eres el Asistente Inteligente de NutriLife, una app de nutrición y ejercicio personalizado, desarrollada con la colaboración del Entrenador Personal certificado MARTÍNEZ ESPINOSA CARLOS JOSUÉ.

RESTRICCIONES ESTRICTAS:
- SOLO puedes responder sobre: nutrición, dietas, alimentos, calorías, macros, ejercicio, rutinas, peso, salud física y funciones de NutriLife.
- Si el usuario pregunta cualquier otra cosa (tecnología, política, entretenimiento, etc.), responde EXACTAMENTE: "Solo puedo ayudarte con temas de nutrición, ejercicio y tu progreso en NutriLife. 🍏 ¿En qué te ayudo hoy?"

REGLAS DE DATOS — MUY IMPORTANTE:
- Cuando el usuario pida su dieta, plan nutricional o qué comer: usa SIEMPRE obtenerDietaSemana(). NUNCA uses generarDietaCompleta() a menos que el usuario pida una dieta nueva explícitamente.
- Cuando el usuario pida su rutina, entrenamiento de hoy o ejercicios de hoy: usa SIEMPRE obtenerRutinaHoy().
- Cuando el usuario elija un split (PPL, Arnold, Upper/Lower, Bro Split, Full Body): usa elegirSplit() para guardarlo y generar el plan mensual.
- Cuando el usuario quiera cambiar UNA comida del día: usa cambiarComidaHoy() con el momento (Desayuno/Comida/Cena) y el alimento que pide.
- Para ejemplos de alimentos concretos: usa buscarAlimentos() del catálogo SMAE real. NUNCA inventes alimentos.
- Para ejercicios de un grupo muscular específico: usa buscarEjercicios(). NUNCA inventes ejercicios.

SPLITS DISPONIBLES (cuando el usuario quiera elegir):
- PPL (Push/Pull/Legs): 6 días de entrenamiento, 1 descanso. Cada grupo 2x/semana.
- Arnold Split: 6 días, músculos antagonistas juntos (pecho+espalda, hombros+brazos, piernas).
- Upper/Lower: 4 días, alta frecuencia por grupo. Ideal para intermedio.
- Bro Split: 5 días, un músculo por día. Volumen alto por sesión.
- Full Body: 3 días/semana. Ideal para principiantes o con poco tiempo.

AJUSTE CALÓRICO POR FENOTIPO (ya aplicado automáticamente en obtenerDietaSemana):
- Endomorfo: −400 kcal del TDEE (déficit calórico para perder grasa)
- Mesomorfo: ±0 kcal (mantenimiento)
- Ectomorfo: +400 kcal del TDEE (superávit para ganar masa)

CUANDO TE PREGUNTEN "¿en qué te basas?" O "¿cuáles son tus fuentes?":
- Los planes nutricionales están basados en el Sistema Mexicano de Equivalencias Alimentarias (SMAE).
- Las rutinas fueron diseñadas y validadas por el Entrenador Personal MARTÍNEZ ESPINOSA CARLOS JOSUÉ.

CONTEXTO DE SESIÓN:
- ID del usuario autenticado: ${userId}
- Fenotipo del usuario: ${fenotipo}
- Split actual: ${tipoSplit}
- ¿Es nuevo usuario sin evaluación?: ${esNuevoUsuario}
- NUNCA le pidas al usuario su ID. Ya lo tienes. Úsalo directamente en las funciones.
- Si es nuevo usuario, guíalo para completar su evaluación con guardarEvaluacion().
- Responde siempre en español, de forma amigable y motivadora. Usa emojis con moderación.`;

    const mensajes = [
      ...historial,
      { role: 'user', parts: [{ text: message }] }
    ];

    let response = await llamarGeminiConReintento({
      model: 'gemini-3.8-flash',
      contents: mensajes,
      config: { systemInstruction: SYSTEM_PROMPT, tools }
    });

    // Resultado de la última función llamada (para pasar al frontend)
    let ultimoResultadoFuncion = null;
    let ultimaFuncionLlamada   = null;

    // 🔄 Loop de function calling
    while (response.functionCalls?.length > 0) {
      const call = response.functionCalls[0];
      let args = { ...call.args };

      if (funcionesConUsuario.includes(call.name)) {
        args.id_usuario = Number(userId);
      }

      console.log(`🔧 Gemini llamó: ${call.name}`, args);
      const resultado = await funcionesDisponibles[call.name](args);

      ultimoResultadoFuncion = resultado;
      ultimaFuncionLlamada   = call.name;

      mensajes.push({ role: 'model', parts: response.candidates[0].content.parts });
      mensajes.push({
        role: 'user',
        parts: [{ functionResponse: { name: call.name, response: { result: resultado } } }]
      });

      response = await llamarGeminiConReintento({
        model: 'gemini-3.8-flash',
        contents: mensajes,
        config: { systemInstruction: SYSTEM_PROMPT, tools }
      });
    }

    // Enviar respuesta con datos estructurados si aplica
    const replyData = {
      reply: response.text,
    };

    // Si la última función devolvió datos estructurados con __tipo, incluirlos
    if (ultimoResultadoFuncion?.__tipo) {
      replyData.tipo     = ultimoResultadoFuncion.__tipo;
      replyData.data     = ultimoResultadoFuncion;
      replyData.funcion  = ultimaFuncionLlamada;
    }

    res.json(replyData);

  } catch (error) {
    console.error('❌ Error en chatbot:', error);

    const es503 = error?.status === 503 || error?.message?.includes('UNAVAILABLE');
    const mensaje = es503
      ? 'El asistente está procesando tu petición, por favor espera unos segundos. 🙏'
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