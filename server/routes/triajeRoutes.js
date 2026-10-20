// server/routes/triajeRoutes.js
const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');

router.post('/guardar', async (req, res) => {
  try {
        const {
      id_usuario,
      rango_edad, fenotipo,
      padece_enfermedad, enfermedades_declaradas, apto_alto_impacto,
      tiene_diabetes, tipo_diabetes, tiene_hipertension, tiene_cardiopatia,
      tiene_asma, tiene_lesion_articular, zona_lesion, tiene_osteoporosis,
      embarazada, medicamentos_activos, desc_medicamentos, nivel_dolor_cronico
    } = req.body;

    // Determinar si es apto automáticamente
    const aptoCalculado = !(tiene_cardiopatia || (tiene_diabetes && tipo_diabetes === 'tipo1'));

    await pool.query(`
      INSERT INTO perfil_salud_triaje (
        id_usuario, padece_enfermedad, enfermedades_declaradas, apto_alto_impacto,
        tiene_diabetes, tipo_diabetes, tiene_hipertension, tiene_cardiopatia,
        tiene_asma, tiene_lesion_articular, zona_lesion, tiene_osteoporosis,
        embarazada, medicamentos_activos, desc_medicamentos, nivel_dolor_cronico,
        triaje_completado
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,true)
      ON CONFLICT (id_usuario) DO UPDATE SET
        padece_enfermedad       = EXCLUDED.padece_enfermedad,
        enfermedades_declaradas = EXCLUDED.enfermedades_declaradas,
        apto_alto_impacto       = EXCLUDED.apto_alto_impacto,
        tiene_diabetes          = EXCLUDED.tiene_diabetes,
        tipo_diabetes           = EXCLUDED.tipo_diabetes,
        tiene_hipertension      = EXCLUDED.tiene_hipertension,
        tiene_cardiopatia       = EXCLUDED.tiene_cardiopatia,
        tiene_asma              = EXCLUDED.tiene_asma,
        tiene_lesion_articular  = EXCLUDED.tiene_lesion_articular,
        zona_lesion             = EXCLUDED.zona_lesion,
        tiene_osteoporosis      = EXCLUDED.tiene_osteoporosis,
        embarazada              = EXCLUDED.embarazada,
        medicamentos_activos    = EXCLUDED.medicamentos_activos,
        desc_medicamentos       = EXCLUDED.desc_medicamentos,
        nivel_dolor_cronico     = EXCLUDED.nivel_dolor_cronico,
        triaje_completado       = true
    `, [
      id_usuario,
      padece_enfermedad,
      enfermedades_declaradas || 'Ninguna',
      aptoCalculado,
      tiene_diabetes        || false,
      tipo_diabetes         || null,
      tiene_hipertension    || false,
      tiene_cardiopatia     || false,
      tiene_asma            || false,
      tiene_lesion_articular || false,
      zona_lesion           || null,
      tiene_osteoporosis    || false,
      embarazada            || false,
      medicamentos_activos  || false,
      desc_medicamentos     || null,
      nivel_dolor_cronico   || 0
    ]);

    res.json({ success: true, apto: aptoCalculado });

  } catch (err) {
    console.error('❌ Error guardando triaje:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;