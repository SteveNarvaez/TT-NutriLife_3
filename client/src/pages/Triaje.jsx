import React, { useState } from 'react';
// ─── SVGs de somatotipos ───────────────────────────────────────────────────
const SvgEctomorfo = () => (
  <svg viewBox="0 0 80 160" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="40" cy="18" rx="11" ry="13" fill="#FBBF24" stroke="#D97706" strokeWidth="1.5"/>
    <rect x="35" y="29" width="10" height="9" rx="3" fill="#FBBF24"/>
    <path d="M26 38 Q40 36 54 38 L51 85 Q40 83 29 85 Z" fill="#34D399" stroke="#059669" strokeWidth="1.2"/>
    <ellipse cx="23" cy="42" rx="6" ry="4" fill="#34D399"/>
    <ellipse cx="57" cy="42" rx="6" ry="4" fill="#34D399"/>
    <path d="M17 42 Q12 60 14 78" stroke="#FBBF24" strokeWidth="7" strokeLinecap="round"/>
    <path d="M63 42 Q68 60 66 78" stroke="#FBBF24" strokeWidth="7" strokeLinecap="round"/>
    <ellipse cx="14" cy="81" rx="5" ry="4" fill="#FBBF24"/>
    <ellipse cx="66" cy="81" rx="5" ry="4" fill="#FBBF24"/>
    <path d="M29 83 Q40 81 51 83 L54 105 Q40 103 26 105 Z" fill="#6EE7B7" stroke="#059669" strokeWidth="1"/>
    <path d="M30 105 Q27 130 28 152" stroke="#FBBF24" strokeWidth="9" strokeLinecap="round"/>
    <path d="M50 105 Q53 130 52 152" stroke="#FBBF24" strokeWidth="9" strokeLinecap="round"/>
    <ellipse cx="28" cy="154" rx="8" ry="4" fill="#FBBF24"/>
    <ellipse cx="52" cy="154" rx="8" ry="4" fill="#FBBF24"/>
  </svg>
);

const SvgMesomorfo = () => (
  <svg viewBox="0 0 80 160" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="40" cy="17" rx="13" ry="14" fill="#FBBF24" stroke="#D97706" strokeWidth="1.5"/>
    <rect x="33" y="29" width="14" height="9" rx="3" fill="#FBBF24"/>
    <path d="M18 38 Q40 34 62 38 L56 85 Q40 82 24 85 Z" fill="#60A5FA" stroke="#2563EB" strokeWidth="1.2"/>
    <ellipse cx="14" cy="41" rx="8" ry="5" fill="#60A5FA"/>
    <ellipse cx="66" cy="41" rx="8" ry="5" fill="#60A5FA"/>
    <path d="M8 41 Q4 58 7 76" stroke="#FBBF24" strokeWidth="11" strokeLinecap="round"/>
    <path d="M72 41 Q76 58 73 76" stroke="#FBBF24" strokeWidth="11" strokeLinecap="round"/>
    <ellipse cx="7" cy="79" rx="6" ry="5" fill="#FBBF24"/>
    <ellipse cx="73" cy="79" rx="6" ry="5" fill="#FBBF24"/>
    <path d="M24 83 Q40 80 56 83 L59 105 Q40 102 21 105 Z" fill="#93C5FD" stroke="#2563EB" strokeWidth="1"/>
    <path d="M28 105 Q24 130 25 152" stroke="#FBBF24" strokeWidth="13" strokeLinecap="round"/>
    <path d="M52 105 Q56 130 55 152" stroke="#FBBF24" strokeWidth="13" strokeLinecap="round"/>
    <ellipse cx="25" cy="154" rx="9" ry="5" fill="#FBBF24"/>
    <ellipse cx="55" cy="154" rx="9" ry="5" fill="#FBBF24"/>
  </svg>
);

const SvgEndomorfo = () => (
  <svg viewBox="0 0 80 160" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="40" cy="16" rx="14" ry="14" fill="#FBBF24" stroke="#D97706" strokeWidth="1.5"/>
    <rect x="32" y="28" width="16" height="8" rx="3" fill="#FBBF24"/>
    <path d="M14 36 Q40 32 66 36 L68 88 Q40 92 12 88 Z" fill="#F87171" stroke="#DC2626" strokeWidth="1.2"/>
    <ellipse cx="10" cy="42" rx="7" ry="6" fill="#F87171"/>
    <ellipse cx="70" cy="42" rx="7" ry="6" fill="#F87171"/>
    <path d="M6 42 Q2 60 5 78" stroke="#FBBF24" strokeWidth="13" strokeLinecap="round"/>
    <path d="M74 42 Q78 60 75 78" stroke="#FBBF24" strokeWidth="13" strokeLinecap="round"/>
    <ellipse cx="5" cy="81" rx="7" ry="5" fill="#FBBF24"/>
    <ellipse cx="75" cy="81" rx="7" ry="5" fill="#FBBF24"/>
    <path d="M12 87 Q40 91 68 87 L65 110 Q40 114 15 110 Z" fill="#FCA5A5" stroke="#DC2626" strokeWidth="1"/>
    <path d="M24 110 Q20 132 22 153" stroke="#FBBF24" strokeWidth="16" strokeLinecap="round"/>
    <path d="M56 110 Q60 132 58 153" stroke="#FBBF24" strokeWidth="16" strokeLinecap="round"/>
    <ellipse cx="22" cy="155" rx="10" ry="5" fill="#FBBF24"/>
    <ellipse cx="58" cy="155" rx="10" ry="5" fill="#FBBF24"/>
  </svg>
);

const AgeIcons = {
  '18-29': (
    <svg viewBox="0 0 60 80" className="w-full h-full" fill="none">
      <ellipse cx="30" cy="15" rx="10" ry="11" fill="#FBBF24"/>
      <path d="M16 28 Q30 24 44 28 L42 58 Q30 56 18 58 Z" fill="#818CF8"/>
      <path d="M16 56 Q15 68 16 76" stroke="#FBBF24" strokeWidth="8" strokeLinecap="round"/>
      <path d="M44 56 Q45 68 44 76" stroke="#FBBF24" strokeWidth="8" strokeLinecap="round"/>
    </svg>
  ),
  '30-39': (
    <svg viewBox="0 0 60 80" className="w-full h-full" fill="none">
      <ellipse cx="30" cy="15" rx="11" ry="11" fill="#FBBF24"/>
      <path d="M14 28 Q30 23 46 28 L44 60 Q30 58 16 60 Z" fill="#34D399"/>
      <path d="M14 58 Q13 70 14 77" stroke="#FBBF24" strokeWidth="9" strokeLinecap="round"/>
      <path d="M46 58 Q47 70 46 77" stroke="#FBBF24" strokeWidth="9" strokeLinecap="round"/>
    </svg>
  ),
  '40-49': (
    <svg viewBox="0 0 60 80" className="w-full h-full" fill="none">
      <ellipse cx="30" cy="15" rx="12" ry="11" fill="#FBBF24"/>
      <path d="M12 28 Q30 23 48 28 L46 62 Q30 60 14 62 Z" fill="#60A5FA"/>
      <path d="M14 60 Q13 71 14 77" stroke="#FBBF24" strokeWidth="9" strokeLinecap="round"/>
      <path d="M46 60 Q47 71 46 77" stroke="#FBBF24" strokeWidth="9" strokeLinecap="round"/>
      <line x1="50" y1="40" x2="52" y2="77" stroke="#9CA3AF" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  ),
  '50+': (
    <svg viewBox="0 0 60 80" className="w-full h-full" fill="none">
      <ellipse cx="30" cy="15" rx="12" ry="11" fill="#D1D5DB"/>
      <ellipse cx="30" cy="8" rx="12" ry="6" fill="#9CA3AF"/>
      <path d="M12 28 Q30 24 48 28 L46 63 Q30 61 14 63 Z" fill="#9CA3AF"/>
      <path d="M14 61 Q13 70 14 77" stroke="#D1D5DB" strokeWidth="9" strokeLinecap="round"/>
      <path d="M46 61 Q47 70 46 77" stroke="#D1D5DB" strokeWidth="9" strokeLinecap="round"/>
      <line x1="50" y1="38" x2="53" y2="77" stroke="#6B7280" strokeWidth="3.5" strokeLinecap="round"/>
      <line x1="47" y1="37" x2="53" y2="37" stroke="#6B7280" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  ),
};
// ─── Pasos del triaje ──────────────────────────────────────────────────────
const PASOS = [
  {
    id: 'bienvenida',
    tipo: 'info',
    titulo: 'Cuestionario de Aptitud Física',
    descripcion: 'Este cuestionario fue diseñado con la colaboración del Entrenador Personal certificado MARTÍNEZ ESPINOSA CARLOS JOSUÉ para evaluar tu condición de salud antes de iniciar cualquier programa de ejercicio. Responde con honestidad — tus respuestas son confidenciales y solo se usan para personalizar tu plan.',
    icono: '🩺',
  },

  // ── Rango de edad ──
  {
    id: 'rango_edad',
    tipo: 'imagen-opciones',
    seccion: 'Perfil Personal',
    icono: '🎂',
    pregunta: '¿Cuál es tu rango de edad?',
    campo: 'rango_edad',
    columnas: 2,
    opciones: [
      { valor: '18-29', etiqueta: '18 ~ 29', desc: 'Joven adulto',  svgKey: '18-29', color: 'from-violet-400 to-purple-500' },
      { valor: '30-39', etiqueta: '30 ~ 39', desc: 'Adulto joven',  svgKey: '30-39', color: 'from-emerald-400 to-green-500' },
      { valor: '40-49', etiqueta: '40 ~ 49', desc: 'Adulto medio',  svgKey: '40-49', color: 'from-blue-400 to-cyan-500'    },
      { valor: '50+',   etiqueta: '50+',     desc: 'Adulto mayor',  svgKey: '50+',   color: 'from-gray-400 to-slate-500'   },
    ],
  },

  // ── Fenotipo / somatotipo ──
  {
    id: 'fenotipo',
    tipo: 'imagen-opciones',
    seccion: 'Perfil Personal',
    icono: '🧬',
    pregunta: '¿Con qué tipo de cuerpo te identificas más?',
    campo: 'fenotipo',
    columnas: 3,
    info: 'Tu somatotipo ayuda a personalizar la dieta y rutinas.',
    opciones: [
      { valor: 'ectomorfo', etiqueta: 'Ectomorfo', desc: 'Delgado, metabolismo rápido', SvgComponent: SvgEctomorfo, color: 'from-emerald-400 to-teal-500' },
      { valor: 'mesomorfo', etiqueta: 'Mesomorfo', desc: 'Atlético, musculoso',         SvgComponent: SvgMesomorfo, color: 'from-blue-400 to-indigo-500'  },
      { valor: 'endomorfo', etiqueta: 'Endomorfo', desc: 'Tendencia a acumular grasa', SvgComponent: SvgEndomorfo, color: 'from-rose-400 to-red-500'     },
    ],
  },
  {
    id: 'diabetes',
    tipo: 'pregunta',
    seccion: 'Enfermedades Metabólicas',
    icono: '🩸',
    pregunta: '¿Tienes o te han diagnosticado diabetes?',
    campo: 'tiene_diabetes',
    subpregunta: {
      condicion: true,
      pregunta: '¿De qué tipo?',
      campo: 'tipo_diabetes',
      opciones: [
        { valor: 'tipo1', etiqueta: 'Tipo 1', desc: 'Insulinodependiente desde la infancia' },
        { valor: 'tipo2', etiqueta: 'Tipo 2', desc: 'Generalmente relacionada con hábitos' },
        { valor: 'no_se', etiqueta: 'No lo sé', desc: 'No recuerdo el diagnóstico exacto' },
      ],
    },
  },
  {
    id: 'hipertension',
    tipo: 'pregunta',
    seccion: 'Sistema Cardiovascular',
    icono: '❤️',
    pregunta: '¿Tienes hipertensión arterial (presión alta)?',
    campo: 'tiene_hipertension',
    info: 'La hipertensión puede requerir ajustes en la intensidad del ejercicio.',
  },
  {
    id: 'cardiopatia',
    tipo: 'pregunta',
    seccion: 'Sistema Cardiovascular',
    icono: '🫀',
    pregunta: '¿Has tenido alguna enfermedad cardíaca, infarto o arritmia?',
    campo: 'tiene_cardiopatia',
    info: 'Incluye cualquier condición diagnosticada por cardiólogo.',
    alerta: 'Una respuesta afirmativa requiere autorización médica para ejercicio de alta intensidad.',
  },
  {
    id: 'asma',
    tipo: 'pregunta',
    seccion: 'Sistema Respiratorio',
    icono: '🫁',
    pregunta: '¿Padeces asma o alguna enfermedad respiratoria crónica?',
    campo: 'tiene_asma',
    info: 'El asma controlada generalmente permite ejercicio moderado.',
  },
  {
    id: 'lesion',
    tipo: 'pregunta',
    seccion: 'Sistema Musculoesquelético',
    icono: '🦴',
    pregunta: '¿Tienes alguna lesión articular o muscular activa?',
    campo: 'tiene_lesion_articular',
    subpregunta: {
      condicion: true,
      pregunta: '¿En qué zona?',
      campo: 'zona_lesion',
      opciones: [
        { valor: 'rodilla',  etiqueta: 'Rodilla',   desc: 'Menisco, ligamentos, rótula' },
        { valor: 'hombro',   etiqueta: 'Hombro',    desc: 'Manguito rotador, bursitis' },
        { valor: 'espalda',  etiqueta: 'Espalda',   desc: 'Lumbar, cervical, hernia' },
        { valor: 'tobillo',  etiqueta: 'Tobillo/Pie', desc: 'Esguince, fascitis plantar' },
        { valor: 'cadera',   etiqueta: 'Cadera',    desc: 'Displasia, bursitis' },
        { valor: 'otro',     etiqueta: 'Otra zona', desc: 'Brazo, muñeca, cuello u otra' },
      ],
    },
  },
  {
    id: 'osteoporosis',
    tipo: 'pregunta',
    seccion: 'Sistema Musculoesquelético',
    icono: '🦷',
    pregunta: '¿Te han diagnosticado osteoporosis u osteopenia?',
    campo: 'tiene_osteoporosis',
    info: 'Afecta la selección de ejercicios de impacto.',
  },
  {
    id: 'embarazo',
    tipo: 'pregunta',
    seccion: 'Estado Fisiológico',
    icono: '🤰',
    pregunta: '¿Estás embarazada o en período de lactancia?',
    campo: 'embarazada',
    info: 'El ejercicio durante el embarazo requiere adaptaciones específicas.',
  },
  {
    id: 'medicamentos',
    tipo: 'pregunta',
    seccion: 'Medicamentos',
    icono: '💊',
    pregunta: '¿Tomas medicamentos de forma continua?',
    campo: 'medicamentos_activos',
    subpregunta: {
      condicion: true,
      pregunta: '¿Cuáles medicamentos?',
      campo: 'desc_medicamentos',
      tipo: 'texto',
      placeholder: 'Ej: Metformina, Losartán, Salbutamol...',
    },
  },
  {
    id: 'dolor',
    tipo: 'escala',
    seccion: 'Dolor Crónico',
    icono: '😣',
    pregunta: '¿Cuál es tu nivel de dolor crónico habitual?',
    campo: 'nivel_dolor_cronico',
    info: 'Dolor que experimentas de forma regular, no temporal.',
  },
  {
    id: 'resumen',
    tipo: 'resumen',
    titulo: 'Resumen de tu triaje',
    icono: '✅',
  },
];

const INITIAL_DATA = {
  rango_edad: '',
  fenotipo: '',
  padece_enfermedad: false,
  enfermedades_declaradas: '',
  apto_alto_impacto: true,
  tiene_diabetes: false,
  tipo_diabetes: '',
  tiene_hipertension: false,
  tiene_cardiopatia: false,
  tiene_asma: false,
  tiene_lesion_articular: false,
  zona_lesion: '',
  tiene_osteoporosis: false,
  embarazada: false,
  medicamentos_activos: false,
  desc_medicamentos: '',
  nivel_dolor_cronico: 0,
};

// ─── Helpers ───────────────────────────────────────────────────────────────
const calcularApto = (d) =>
  !(d.tiene_cardiopatia || (d.tiene_diabetes && d.tipo_diabetes === 'tipo1'));

const resumenItems = (d) => [
  { label: 'Rango de edad',       valor: d.rango_edad || 'No indicado' },
  { label: 'Somatotipo',          valor: d.fenotipo   || 'No indicado' },
  { label: 'Diabetes',            valor: d.tiene_diabetes ? `Sí (${d.tipo_diabetes || 'sin especificar'})` : 'No' },
  { label: 'Hipertensión',        valor: d.tiene_hipertension ? 'Sí' : 'No' },
  { label: 'Cardiopatía',         valor: d.tiene_cardiopatia ? 'Sí ⚠️' : 'No' },
  { label: 'Asma / Respiratorio', valor: d.tiene_asma ? 'Sí' : 'No' },
  { label: 'Lesión articular',    valor: d.tiene_lesion_articular ? `Sí (${d.zona_lesion || 'zona no especificada'})` : 'No' },
  { label: 'Osteoporosis',        valor: d.tiene_osteoporosis ? 'Sí' : 'No' },
  { label: 'Embarazo / Lactancia',valor: d.embarazada ? 'Sí' : 'No' },
  { label: 'Medicamentos',        valor: d.medicamentos_activos ? `Sí: ${d.desc_medicamentos || '—'}` : 'No' },
  { label: 'Dolor crónico',       valor: `${d.nivel_dolor_cronico}/10` },
];

// ─── Componente ────────────────────────────────────────────────────────────
const Triaje = ({ modoModal = false, onCompletado, onCerrar }) => {
  const [paso, setPaso]   = useState(0);
  const [data, setData]   = useState(INITIAL_DATA);
  const [enviado, setEnviado] = useState(false);

  const pasoActual = PASOS[paso];
  const totalPreguntas = PASOS.filter(p => p.tipo === 'pregunta' || p.tipo === 'escala' || p.tipo === 'imagen-opciones').length;
  const preguntasRespondidas = PASOS.slice(0, paso).filter(p => p.tipo === 'pregunta' || p.tipo === 'escala' || p.tipo === 'imagen-opciones').length;
  const progreso = Math.round((preguntasRespondidas / totalPreguntas) * 100);

  const set = (campo, valor) => setData(prev => ({ ...prev, [campo]: valor }));

  const siguiente = () => { if (paso < PASOS.length - 1) setPaso(p => p + 1); };
  const anterior  = () => { if (paso > 0) setPaso(p => p - 1); };

  const confirmarYEnviar = () => {
    // Calcular campos derivados
    const padece = data.tiene_diabetes || data.tiene_hipertension ||
                   data.tiene_cardiopatia || data.tiene_asma ||
                   data.tiene_osteoporosis || data.tiene_lesion_articular;

    const enfermedades = [
      data.tiene_diabetes        && `Diabetes ${data.tipo_diabetes || ''}`,
      data.tiene_hipertension    && 'Hipertensión',
      data.tiene_cardiopatia     && 'Cardiopatía',
      data.tiene_asma            && 'Asma',
      data.tiene_osteoporosis    && 'Osteoporosis',
      data.tiene_lesion_articular && `Lesión articular (${data.zona_lesion || 'no especificada'})`,
    ].filter(Boolean).join(', ');

    const payload = {
      ...data,
      padece_enfermedad: padece,
      enfermedades_declaradas: enfermedades || 'Ninguna',
      apto_alto_impacto: calcularApto(data),
    };

    // Si está en modo modal, llamar callback directo
    if (modoModal && onCompletado) {
      onCompletado(payload);
      return;
    }

    // Fallback: ventana popup (legacy)
    if (window.opener) {
      window.opener.postMessage({ type: 'TRIAJE_COMPLETADO', payload }, '*');
    }

    setEnviado(true);

    setEnviado(true);
  };

  // ── Pantalla de éxito ───────────────────────────────────────────────────
    if (enviado) {
    const apto = calcularApto(data);
    return (
      <div className={`${modoModal ? 'p-6' : 'min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-6'}`}>
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">{apto ? '🎉' : '⚠️'}</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {apto ? '¡Triaje completado!' : 'Triaje completado'}
          </h2>
          <p className="text-gray-500 mb-4 text-sm">
            {apto
              ? 'Eres apto para ejercicio de alta intensidad. Regresa a la ventana de registro para crear tu cuenta.'
              : 'Tu perfil indica que necesitas supervisión médica para ejercicio intenso. Aun así puedes usar NutriLife con rutinas adaptadas. Regresa a la ventana de registro.'}
          </p>
          <div className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${
            apto ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
          }`}>
            {apto ? '✅ Apto para alto impacto' : '⚠️ Requiere supervisión médica'}
          </div>
          <p className="text-xs text-gray-400 mt-6">Puedes cerrar esta ventana y continuar el registro.</p>
                    {modoModal ? (
            <button onClick={onCerrar} className="mt-3 text-sm text-green-600 underline">
              Cerrar
            </button>
          ) : (
            <button onClick={() => window.close()} className="mt-3 text-sm text-green-600 underline">
              Cerrar ventana
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">

        {/* HEADER */}
        <div className="bg-green-600 px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-green-100 text-xs font-medium uppercase tracking-wide">NutriLife · Evaluación médica</p>
              <p className="text-white text-xs mt-0.5">Lic. MARTÍNEZ ESPINOSA CARLOS JOSUÉ</p>
            </div>
            <div className="text-right">
              <p className="text-green-100 text-xs">Paso {paso + 1} de {PASOS.length}</p>
              <p className="text-white text-sm font-bold">{progreso}% completado</p>
            </div>
          </div>
          {/* Barra de progreso */}
          <div className="w-full bg-green-500 rounded-full h-1.5">
            <div
              className="bg-white rounded-full h-1.5 transition-all duration-500"
              style={{ width: `${progreso}%` }}
            />
          </div>
        </div>

        {/* CONTENIDO */}
        <div className="p-6 min-h-72">

          {/* PASO: Bienvenida */}
          {pasoActual.tipo === 'info' && (
            <div className="text-center py-4">
              <div className="text-5xl mb-4">{pasoActual.icono}</div>
              <h2 className="text-xl font-bold text-gray-800 mb-3">{pasoActual.titulo}</h2>
              <p className="text-gray-500 text-sm leading-relaxed">{pasoActual.descripcion}</p>
            </div>
          )}
          {/* PASO: Imagen-opciones (edad y fenotipo) */}
          {pasoActual.tipo === 'imagen-opciones' && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-green-600 uppercase tracking-wide bg-green-50 px-2 py-0.5 rounded-full">
                  {pasoActual.seccion}
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mt-3 mb-1">{pasoActual.icono} {pasoActual.pregunta}</h3>
              {pasoActual.info && (
                <p className="text-xs text-gray-400 mb-3 bg-blue-50 px-3 py-2 rounded-lg">ℹ️ {pasoActual.info}</p>
              )}
              <div className={`grid gap-3 mt-4 ${pasoActual.columnas === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                {pasoActual.opciones.map(op => {
                  const sel = data[pasoActual.campo] === op.valor;
                  return (
                    <button key={op.valor} type="button" onClick={() => set(pasoActual.campo, op.valor)}
                      className={`relative flex flex-col items-center rounded-2xl border-2 overflow-hidden transition-all duration-200 ${
                        sel ? 'border-green-500 shadow-lg scale-[1.03]' : 'border-gray-200 hover:border-green-300 hover:shadow-md'
                      }`}
                    >
                      <div className={`w-full bg-gradient-to-b ${op.color} flex items-end justify-center`}
                        style={{ height: pasoActual.columnas === 3 ? '110px' : '130px' }}>
                        <div style={{ width: pasoActual.columnas === 3 ? '60px' : '70px', height: pasoActual.columnas === 3 ? '105px' : '125px' }}>
                          {op.SvgComponent ? <op.SvgComponent /> : AgeIcons[op.svgKey]}
                        </div>
                      </div>
                      <div className={`w-full py-2 px-1 text-center ${sel ? 'bg-green-50' : 'bg-white'}`}>
                        <p className={`text-sm font-bold ${sel ? 'text-green-700' : 'text-gray-800'}`}>{op.etiqueta}</p>
                        {op.desc && <p className="text-[10px] text-gray-400 leading-tight mt-0.5">{op.desc}</p>}
                      </div>
                      {sel && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {/* PASO: Pregunta Sí/No */}
          {pasoActual.tipo === 'pregunta' && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-green-600 uppercase tracking-wide bg-green-50 px-2 py-0.5 rounded-full">
                  {pasoActual.seccion}
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mt-3 mb-2">{pasoActual.icono} {pasoActual.pregunta}</h3>

              {pasoActual.info && (
                <p className="text-xs text-gray-400 mb-3 bg-blue-50 px-3 py-2 rounded-lg">ℹ️ {pasoActual.info}</p>
              )}
              {pasoActual.alerta && (
                <p className="text-xs text-amber-700 mb-3 bg-amber-50 px-3 py-2 rounded-lg">⚠️ {pasoActual.alerta}</p>
              )}

              {/* Botones Sí/No */}
              <div className="flex gap-3 mt-4">
                {[{ valor: true, etiqueta: 'Sí', color: 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100' },
                  { valor: false, etiqueta: 'No', color: 'border-green-300 bg-green-50 text-green-700 hover:bg-green-100' }
                ].map(op => (
                  <button key={String(op.valor)} type="button"
                    onClick={() => set(pasoActual.campo, op.valor)}
                    className={`flex-1 py-3 rounded-xl border-2 font-bold text-sm transition-all ${op.color} ${
                      data[pasoActual.campo] === op.valor ? 'ring-2 ring-offset-1 ring-gray-400 scale-[1.02]' : ''
                    }`}
                  >
                    {op.etiqueta}
                  </button>
                ))}
              </div>

              {/* Subpregunta condicional */}
              {pasoActual.subpregunta && data[pasoActual.campo] === pasoActual.subpregunta.condicion && (
                <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="text-sm font-semibold text-gray-700 mb-3">{pasoActual.subpregunta.pregunta}</p>

                  {pasoActual.subpregunta.tipo === 'texto' ? (
                    <input
                      type="text"
                      placeholder={pasoActual.subpregunta.placeholder}
                      value={data[pasoActual.subpregunta.campo] || ''}
                      onChange={e => set(pasoActual.subpregunta.campo, e.target.value)}
                      className="w-full p-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-400"
                    />
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {pasoActual.subpregunta.opciones.map(op => (
                        <button key={op.valor} type="button"
                          onClick={() => set(pasoActual.subpregunta.campo, op.valor)}
                          className={`p-2.5 rounded-lg border text-left transition-all ${
                            data[pasoActual.subpregunta.campo] === op.valor
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 hover:border-green-300'
                          }`}
                        >
                          <p className="text-xs font-bold text-gray-800">{op.etiqueta}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{op.desc}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* PASO: Escala de dolor */}
          {pasoActual.tipo === 'escala' && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-green-600 uppercase tracking-wide bg-green-50 px-2 py-0.5 rounded-full">
                  {pasoActual.seccion}
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mt-3 mb-2">{pasoActual.icono} {pasoActual.pregunta}</h3>
              {pasoActual.info && (
                <p className="text-xs text-gray-400 mb-4 bg-blue-50 px-3 py-2 rounded-lg">ℹ️ {pasoActual.info}</p>
              )}

              {/* Escala visual */}
              <div className="mt-4">
                <div className="flex justify-between mb-2">
                  <span className="text-xs text-green-600 font-medium">Sin dolor</span>
                  <span className="text-xs text-red-500 font-medium">Dolor intenso</span>
                </div>
                <div className="flex gap-1.5">
                  {[0,1,2,3,4,5,6,7,8,9,10].map(n => (
                    <button key={n} type="button"
                      onClick={() => set(pasoActual.campo, n)}
                      className={`flex-1 py-3 rounded-lg text-xs font-bold border-2 transition-all ${
                        data[pasoActual.campo] === n
                          ? n <= 3 ? 'bg-green-500 border-green-500 text-white'
                          : n <= 6 ? 'bg-amber-500 border-amber-500 text-white'
                          : 'bg-red-500 border-red-500 text-white'
                          : 'border-gray-200 text-gray-400 hover:border-gray-400'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <p className="text-center text-sm font-bold mt-3 text-gray-700">
                  {data[pasoActual.campo] === 0 ? '😊 Sin dolor' :
                   data[pasoActual.campo] <= 3 ? '🙂 Dolor leve' :
                   data[pasoActual.campo] <= 6 ? '😐 Dolor moderado' : '😣 Dolor intenso'}
                </p>
              </div>
            </div>
          )}

          {/* PASO: Resumen */}
          {pasoActual.tipo === 'resumen' && (
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-1">✅ Revisa tu información</h3>
              <p className="text-xs text-gray-400 mb-4">Verifica que todo esté correcto antes de confirmar.</p>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {resumenItems(data).map(item => (
                  <div key={item.label} className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0">
                    <span className="text-xs text-gray-500">{item.label}</span>
                    <span className={`text-xs font-semibold ${
                      item.valor.includes('Sí') ? 'text-amber-600' : 'text-green-600'
                    }`}>{item.valor}</span>
                  </div>
                ))}
              </div>

              {/* Resultado de aptitud */}
              <div className={`mt-4 p-3 rounded-xl text-center ${
                calcularApto(data) ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'
              }`}>
                <p className={`text-sm font-bold ${calcularApto(data) ? 'text-green-700' : 'text-amber-700'}`}>
                  {calcularApto(data)
                    ? '✅ Apto para ejercicio de alta intensidad'
                    : '⚠️ Se recomienda supervisión médica para ejercicio intenso'}
                </p>
              </div>
            </div>
          )}

        </div>

        {/* FOOTER / NAVEGACIÓN */}
        <div className="px-6 pb-6 flex gap-3">
          {paso > 0 && (
            <button type="button" onClick={anterior}
              className="flex-1 py-3 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 transition"
            >
              ← Anterior
            </button>
          )}

          {pasoActual.tipo !== 'resumen' ? (
            <button type="button" onClick={siguiente}
              className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-bold transition shadow-sm"
            >
              {pasoActual.tipo === 'info' ? 'Comenzar evaluación →' : 'Siguiente →'}
            </button>
          ) : (
            <button type="button" onClick={confirmarYEnviar}
              className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold transition shadow-md"
            >
              ✅ Confirmar y enviar
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default Triaje;