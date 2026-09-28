import React, { useState } from 'react';

// ─── Pasos del triaje ──────────────────────────────────────────────────────
const PASOS = [
  {
    id: 'bienvenida',
    tipo: 'info',
    titulo: 'Cuestionario de Aptitud Física',
    descripcion: 'Este cuestionario fue diseñado con la colaboración del Entrenador Personal certificado MARTÍNEZ ESPINOSA CARLOS JOSUÉ para evaluar tu condición de salud antes de iniciar cualquier programa de ejercicio. Responde con honestidad — tus respuestas son confidenciales y solo se usan para personalizar tu plan.',
    icono: '🩺',
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
  { label: 'Diabetes',          valor: d.tiene_diabetes ? `Sí (${d.tipo_diabetes || 'sin especificar'})` : 'No' },
  { label: 'Hipertensión',      valor: d.tiene_hipertension ? 'Sí' : 'No' },
  { label: 'Cardiopatía',       valor: d.tiene_cardiopatia ? 'Sí ⚠️' : 'No' },
  { label: 'Asma / Respiratorio', valor: d.tiene_asma ? 'Sí' : 'No' },
  { label: 'Lesión articular',  valor: d.tiene_lesion_articular ? `Sí (${d.zona_lesion || 'zona no especificada'})` : 'No' },
  { label: 'Osteoporosis',      valor: d.tiene_osteoporosis ? 'Sí' : 'No' },
  { label: 'Embarazo / Lactancia', valor: d.embarazada ? 'Sí' : 'No' },
  { label: 'Medicamentos',      valor: d.medicamentos_activos ? `Sí: ${d.desc_medicamentos || '—'}` : 'No' },
  { label: 'Dolor crónico',     valor: `${d.nivel_dolor_cronico}/10` },
];

// ─── Componente ────────────────────────────────────────────────────────────
const Triaje = () => {
  const [paso, setPaso]   = useState(0);
  const [data, setData]   = useState(INITIAL_DATA);
  const [enviado, setEnviado] = useState(false);

  const pasoActual = PASOS[paso];
  const totalPreguntas = PASOS.filter(p => p.tipo === 'pregunta' || p.tipo === 'escala').length;
  const preguntasRespondidas = PASOS.slice(0, paso).filter(p => p.tipo === 'pregunta' || p.tipo === 'escala').length;
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

    // Enviar mensaje a la ventana padre (Register.jsx)
    if (window.opener) {
      window.opener.postMessage({ type: 'TRIAJE_COMPLETADO', payload }, '*');
    }

    setEnviado(true);
  };

  // ── Pantalla de éxito ───────────────────────────────────────────────────
  if (enviado) {
    const apto = calcularApto(data);
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-6">
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
          <button onClick={() => window.close()} className="mt-3 text-sm text-green-600 underline">
            Cerrar ventana
          </button>
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