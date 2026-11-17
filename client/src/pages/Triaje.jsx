import { useState } from 'react';
import {
  Stethoscope, CalendarRange, Dna, Droplet, HeartPulse, Heart, Wind, Bone, ShieldAlert, Baby, Pill, Activity,
  ClipboardCheck, Info, TriangleAlert, Check, ArrowLeft, ArrowRight, X, CircleCheck,
} from 'lucide-react';
import { BodyFigure, AgeRing } from '../components/TriajeIllustrations';
import { LogoMark } from '../components/Brand';

// ─── Pasos del triaje ──────────────────────────────────────────────────────
const PASOS = [
  {
    id: 'bienvenida',
    tipo: 'info',
    titulo: 'Cuestionario de aptitud física',
    descripcion: 'Este cuestionario fue diseñado con la colaboración del Entrenador Personal certificado MARTÍNEZ ESPINOSA CARLOS JOSUÉ para evaluar tu condición de salud antes de iniciar cualquier programa de ejercicio. Responde con honestidad: tus respuestas son confidenciales y solo se usan para personalizar tu plan.',
    icon: Stethoscope,
  },
  {
    id: 'rango_edad',
    tipo: 'imagen-opciones',
    seccion: 'Perfil personal',
    icon: CalendarRange,
    pregunta: '¿Cuál es tu rango de edad?',
    campo: 'rango_edad',
    columnas: 4,
    opciones: [
      { valor: '18-29', etiqueta: '18–29', desc: 'Adulto joven',      rango: [18, 29] },
      { valor: '30-39', etiqueta: '30–39', desc: 'Adulto',            rango: [30, 39] },
      { valor: '40-49', etiqueta: '40–49', desc: 'Adulto medio',      rango: [40, 49] },
      { valor: '50+',   etiqueta: '50+',   desc: 'Adulto maduro',     rango: [50, 80] },
    ],
  },
  {
    id: 'fenotipo',
    tipo: 'imagen-opciones',
    seccion: 'Perfil personal',
    icon: Dna,
    pregunta: '¿Con qué tipo de cuerpo te identificas más?',
    campo: 'fenotipo',
    columnas: 3,
    info: 'Tu somatotipo ayuda a ajustar tu meta calórica y tus rutinas. Las líneas punteadas marcan hombros, cintura y cadera.',
    opciones: [
      { valor: 'ectomorfo', etiqueta: 'Ectomorfo', desc: 'Complexión delgada, metabolismo rápido' },
      { valor: 'mesomorfo', etiqueta: 'Mesomorfo', desc: 'Complexión atlética, hombros anchos' },
      { valor: 'endomorfo', etiqueta: 'Endomorfo', desc: 'Complexión robusta, tendencia a acumular grasa' },
    ],
  },
  {
    id: 'diabetes',
    tipo: 'pregunta',
    seccion: 'Enfermedades metabólicas',
    icon: Droplet,
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
    seccion: 'Sistema cardiovascular',
    icon: HeartPulse,
    pregunta: '¿Tienes hipertensión arterial (presión alta)?',
    campo: 'tiene_hipertension',
    info: 'La hipertensión puede requerir ajustes en la intensidad del ejercicio.',
  },
  {
    id: 'cardiopatia',
    tipo: 'pregunta',
    seccion: 'Sistema cardiovascular',
    icon: Heart,
    pregunta: '¿Has tenido alguna enfermedad cardíaca, infarto o arritmia?',
    campo: 'tiene_cardiopatia',
    info: 'Incluye cualquier condición diagnosticada por un cardiólogo.',
    alerta: 'Una respuesta afirmativa requiere autorización médica para ejercicio de alta intensidad.',
  },
  {
    id: 'asma',
    tipo: 'pregunta',
    seccion: 'Sistema respiratorio',
    icon: Wind,
    pregunta: '¿Padeces asma o alguna enfermedad respiratoria crónica?',
    campo: 'tiene_asma',
    info: 'El asma controlada generalmente permite ejercicio moderado.',
  },
  {
    id: 'lesion',
    tipo: 'pregunta',
    seccion: 'Sistema musculoesquelético',
    icon: Bone,
    pregunta: '¿Tienes alguna lesión articular o muscular activa?',
    campo: 'tiene_lesion_articular',
    subpregunta: {
      condicion: true,
      pregunta: '¿En qué zona?',
      campo: 'zona_lesion',
      opciones: [
        { valor: 'rodilla', etiqueta: 'Rodilla',     desc: 'Menisco, ligamentos, rótula' },
        { valor: 'hombro',  etiqueta: 'Hombro',      desc: 'Manguito rotador, bursitis' },
        { valor: 'espalda', etiqueta: 'Espalda',     desc: 'Lumbar, cervical, hernia' },
        { valor: 'tobillo', etiqueta: 'Tobillo/Pie', desc: 'Esguince, fascitis plantar' },
        { valor: 'cadera',  etiqueta: 'Cadera',      desc: 'Displasia, bursitis' },
        { valor: 'otro',    etiqueta: 'Otra zona',   desc: 'Brazo, muñeca, cuello u otra' },
      ],
    },
  },
  {
    id: 'osteoporosis',
    tipo: 'pregunta',
    seccion: 'Sistema musculoesquelético',
    icon: ShieldAlert,
    pregunta: '¿Te han diagnosticado osteoporosis u osteopenia?',
    campo: 'tiene_osteoporosis',
    info: 'Afecta la selección de ejercicios de impacto.',
  },
  {
    id: 'embarazo',
    tipo: 'pregunta',
    seccion: 'Estado fisiológico',
    icon: Baby,
    pregunta: '¿Estás embarazada o en período de lactancia?',
    campo: 'embarazada',
    info: 'El ejercicio durante el embarazo requiere adaptaciones específicas.',
  },
  {
    id: 'medicamentos',
    tipo: 'pregunta',
    seccion: 'Medicamentos',
    icon: Pill,
    pregunta: '¿Tomas medicamentos de forma continua?',
    campo: 'medicamentos_activos',
    subpregunta: {
      condicion: true,
      pregunta: '¿Cuáles medicamentos?',
      campo: 'desc_medicamentos',
      tipo: 'texto',
      placeholder: 'Ej.: Metformina, Losartán, Salbutamol…',
    },
  },
  {
    id: 'dolor',
    tipo: 'escala',
    seccion: 'Dolor crónico',
    icon: Activity,
    pregunta: '¿Cuál es tu nivel de dolor crónico habitual?',
    campo: 'nivel_dolor_cronico',
    info: 'Dolor que experimentas de forma regular, no temporal.',
  },
  {
    id: 'resumen',
    tipo: 'resumen',
    titulo: 'Revisa tu información',
    icon: ClipboardCheck,
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
  { label: 'Rango de edad',        valor: d.rango_edad || 'No indicado', alerta: false },
  { label: 'Somatotipo',           valor: d.fenotipo   || 'No indicado', alerta: false },
  { label: 'Diabetes',             valor: d.tiene_diabetes ? `Sí (${d.tipo_diabetes || 'sin especificar'})` : 'No', alerta: d.tiene_diabetes },
  { label: 'Hipertensión',         valor: d.tiene_hipertension ? 'Sí' : 'No', alerta: d.tiene_hipertension },
  { label: 'Cardiopatía',          valor: d.tiene_cardiopatia ? 'Sí' : 'No', alerta: d.tiene_cardiopatia },
  { label: 'Asma / respiratorio',  valor: d.tiene_asma ? 'Sí' : 'No', alerta: d.tiene_asma },
  { label: 'Lesión articular',     valor: d.tiene_lesion_articular ? `Sí (${d.zona_lesion || 'zona no especificada'})` : 'No', alerta: d.tiene_lesion_articular },
  { label: 'Osteoporosis',         valor: d.tiene_osteoporosis ? 'Sí' : 'No', alerta: d.tiene_osteoporosis },
  { label: 'Embarazo / lactancia', valor: d.embarazada ? 'Sí' : 'No', alerta: d.embarazada },
  { label: 'Medicamentos',         valor: d.medicamentos_activos ? `Sí: ${d.desc_medicamentos || '—'}` : 'No', alerta: d.medicamentos_activos },
  { label: 'Dolor crónico',        valor: `${d.nivel_dolor_cronico}/10`, alerta: d.nivel_dolor_cronico >= 7 },
];

const esPregunta = (p) => ['pregunta', 'escala', 'imagen-opciones'].includes(p.tipo);

const SeccionTag = ({ paso }) => {
  const Icon = paso.icon;
  return (
    <div className="flex items-center gap-2.5">
      <span className="icon-tile h-9 w-9 bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
        <Icon size={18} />
      </span>
      <span className="eyebrow">{paso.seccion}</span>
    </div>
  );
};

const Nota = ({ children, tono = 'info' }) => (
  <p className={`mt-3 flex items-start gap-2 rounded-xl px-3.5 py-2.5 text-[13px] ${
    tono === 'alerta'
      ? 'bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-200'
      : 'bg-ink-50 text-ink-600 dark:bg-white/5 dark:text-ink-300'
  }`}>
    {tono === 'alerta' ? <TriangleAlert size={16} className="mt-0.5 shrink-0" /> : <Info size={16} className="mt-0.5 shrink-0" />}
    {children}
  </p>
);

// ─── Componente ────────────────────────────────────────────────────────────
const Triaje = ({ modoModal = false, onCompletado, onCerrar }) => {
  const [paso, setPaso]       = useState(0);
  const [data, setData]       = useState(INITIAL_DATA);
  const [respondidas, setRespondidas] = useState(() => new Set());
  const [enviado, setEnviado] = useState(false);

  const pasoActual = PASOS[paso];
  const totalPreguntas = PASOS.filter(esPregunta).length;
  const preguntasRespondidas = PASOS.slice(0, paso).filter(esPregunta).length;
  const progreso = Math.round((preguntasRespondidas / totalPreguntas) * 100);

  const set = (campo, valor) => {
    setData(prev => ({ ...prev, [campo]: valor }));
    setRespondidas(prev => new Set(prev).add(campo));
  };

  // Una pregunta debe contestarse antes de avanzar
  const puedeAvanzar = (() => {
    const p = pasoActual;
    if (p.tipo === 'imagen-opciones') return Boolean(data[p.campo]);
    if (p.tipo === 'pregunta') {
      if (!respondidas.has(p.campo)) return false;
      const sp = p.subpregunta;
      if (sp && data[p.campo] === sp.condicion && sp.opciones) return Boolean(data[sp.campo]);
      return true;
    }
    return true;
  })();

  const siguiente = () => { if (puedeAvanzar && paso < PASOS.length - 1) setPaso(p => p + 1); };
  const anterior  = () => { if (paso > 0) setPaso(p => p - 1); };

  const confirmarYEnviar = () => {
    const padece = data.tiene_diabetes || data.tiene_hipertension ||
                   data.tiene_cardiopatia || data.tiene_asma ||
                   data.tiene_osteoporosis || data.tiene_lesion_articular;

    const enfermedades = [
      data.tiene_diabetes         && `Diabetes ${data.tipo_diabetes || ''}`,
      data.tiene_hipertension     && 'Hipertensión',
      data.tiene_cardiopatia      && 'Cardiopatía',
      data.tiene_asma             && 'Asma',
      data.tiene_osteoporosis     && 'Osteoporosis',
      data.tiene_lesion_articular && `Lesión articular (${data.zona_lesion || 'no especificada'})`,
    ].filter(Boolean).join(', ');

    const payload = {
      ...data,
      padece_enfermedad: padece,
      enfermedades_declaradas: enfermedades || 'Ninguna',
      apto_alto_impacto: calcularApto(data),
    };

    if (modoModal && onCompletado) {
      onCompletado(payload);
    } else if (window.opener) {
      // Compatibilidad: si se abrió como ventana independiente
      window.opener.postMessage({ type: 'TRIAJE_COMPLETADO', payload }, window.location.origin);
    }
    setEnviado(true);
  };

  // Envoltura: en modo ventana independiente centra la tarjeta en la página
  const envolver = (contenido) => modoModal
    ? contenido
    : <div className="bg-aurora flex min-h-screen items-center justify-center p-4">{contenido}</div>;

  // ── Resultado ──────────────────────────────────────────────────────────
  if (enviado) {
    const apto = calcularApto(data);
    return envolver(
        <div className="card w-full max-w-md p-8 text-center animate-scale-in">
          <span className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${
            apto ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10' : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10'
          }`}>
            {apto ? <CircleCheck size={34} /> : <TriangleAlert size={34} />}
          </span>
          <h2 className="mt-5 text-xl font-bold text-ink-900 dark:text-white">Triaje completado</h2>
          <p className="muted mt-2">
            {apto
              ? 'No se identificaron restricciones para ejercicio de alta intensidad.'
              : 'Tu perfil indica que necesitas supervisión médica para ejercicio intenso. Aun así puedes usar NutriLife con rutinas adaptadas.'}
          </p>
          <span className={`mt-4 ${apto ? 'chip-brand' : 'chip-amber'}`}>
            {apto ? 'Apto para alto impacto' : 'Requiere supervisión médica'}
          </span>
          {modoModal ? (
            <button onClick={onCerrar} className="btn-primary btn-lg mt-7 w-full">
              Continuar con el registro <ArrowRight size={18} />
            </button>
          ) : (
            <>
              <p className="mt-6 text-xs text-ink-400">Regresa a la ventana de registro para crear tu cuenta.</p>
              <button onClick={() => window.close()} className="btn-secondary mt-3 w-full">Cerrar ventana</button>
            </>
          )}
        </div>
    );
  }

  const PasoIcon = pasoActual.icon;

  return envolver(
      <div className={`card flex w-full max-w-2xl flex-col overflow-hidden ${modoModal ? 'max-h-[92vh]' : ''}`}>

        {/* ── Encabezado ── */}
        <header className="border-b border-ink-100 px-6 pb-4 pt-5 dark:border-white/[0.06]">
          <div className="flex items-center gap-3">
            <LogoMark className="h-9 w-9" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink-900 dark:text-white">Triaje de salud</p>
              <p className="truncate text-xs text-ink-400">Validado por: Lic. Martínez Espinosa Carlos Josué</p>
            </div>
            <span className="text-xs font-medium text-ink-500 tabular-nums">
              {Math.min(paso + 1, PASOS.length)} / {PASOS.length}
            </span>
            {modoModal && onCerrar && (
              <button onClick={onCerrar} aria-label="Cerrar triaje" className="btn-ghost -mr-2 p-2">
                <X size={18} />
              </button>
            )}
          </div>
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-ink-100 dark:bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400 transition-all duration-500" style={{ width: `${progreso}%` }} />
          </div>
        </header>

        {/* ── Contenido ── */}
        <div key={paso} className="scroll-thin flex-1 overflow-y-auto px-6 py-6 animate-fade-up">

          {pasoActual.tipo === 'info' && (
            <div className="py-4 text-center">
              <span className="icon-tile mx-auto h-16 w-16 rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                <PasoIcon size={32} />
              </span>
              <h2 className="mt-5 text-xl font-bold text-ink-900 dark:text-white">{pasoActual.titulo}</h2>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-ink-500 dark:text-ink-400">{pasoActual.descripcion}</p>
              <div className="mx-auto mt-6 grid max-w-md grid-cols-3 gap-3 text-left">
                {[['13', 'pasos'], ['≈ 3', 'minutos'], ['100 %', 'confidencial']].map(([v, l]) => (
                  <div key={l} className="rounded-xl bg-ink-50 px-3 py-2.5 text-center dark:bg-white/5">
                    <p className="text-lg font-bold text-ink-900 dark:text-white">{v}</p>
                    <p className="text-[11px] text-ink-400">{l}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pasoActual.tipo === 'imagen-opciones' && (
            <div>
              <SeccionTag paso={pasoActual} />
              <h3 className="mt-4 text-lg font-bold text-ink-900 dark:text-white">{pasoActual.pregunta}</h3>
              {pasoActual.info && <Nota>{pasoActual.info}</Nota>}
              <div className={`mt-5 grid gap-3 ${pasoActual.columnas === 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'}`}>
                {pasoActual.opciones.map(op => {
                  const sel = data[pasoActual.campo] === op.valor;
                  return (
                    <button key={op.valor} type="button" onClick={() => set(pasoActual.campo, op.valor)} aria-pressed={sel}
                      className={`group relative flex flex-col items-center rounded-2xl border-2 p-3 text-center transition-all duration-200 ${
                        sel
                          ? 'border-brand-500 bg-brand-50/60 shadow-[var(--shadow-soft)] dark:bg-brand-500/10'
                          : 'border-ink-100 bg-white hover:border-brand-200 hover:bg-ink-50/60 dark:border-white/10 dark:bg-transparent dark:hover:bg-white/5'
                      }`}>
                      <div className={pasoActual.campo === 'fenotipo' ? 'h-36 w-20 sm:h-40 sm:w-24' : 'h-24 w-24'}>
                        {pasoActual.campo === 'fenotipo'
                          ? <BodyFigure tipo={op.valor} active={sel} />
                          : <AgeRing desde={op.rango[0]} hasta={op.rango[1]} etiqueta={op.etiqueta} active={sel} />}
                      </div>
                      <p className={`mt-2 text-sm font-semibold ${sel ? 'text-brand-700 dark:text-brand-300' : 'text-ink-800 dark:text-ink-100'}`}>
                        {pasoActual.campo === 'fenotipo' ? op.etiqueta : op.desc}
                      </p>
                      {pasoActual.campo === 'fenotipo' && (
                        <p className="mt-0.5 text-[11px] leading-snug text-ink-400">{op.desc}</p>
                      )}
                      {sel && (
                        <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-white shadow animate-scale-in">
                          <Check size={12} strokeWidth={3} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {pasoActual.tipo === 'pregunta' && (
            <div>
              <SeccionTag paso={pasoActual} />
              <h3 className="mt-4 text-lg font-bold text-ink-900 dark:text-white">{pasoActual.pregunta}</h3>
              {pasoActual.info && <Nota>{pasoActual.info}</Nota>}
              {pasoActual.alerta && <Nota tono="alerta">{pasoActual.alerta}</Nota>}

              <div className="mt-5 grid grid-cols-2 gap-3">
                {[{ valor: true, etiqueta: 'Sí' }, { valor: false, etiqueta: 'No' }].map(op => {
                  const sel = respondidas.has(pasoActual.campo) && data[pasoActual.campo] === op.valor;
                  return (
                    <button key={String(op.valor)} type="button" aria-pressed={sel}
                      onClick={() => set(pasoActual.campo, op.valor)}
                      className={`flex items-center justify-center gap-2 rounded-xl border-2 py-3.5 text-sm font-semibold transition-all ${
                        sel
                          ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300'
                          : 'border-ink-100 text-ink-600 hover:border-ink-200 hover:bg-ink-50 dark:border-white/10 dark:text-ink-300 dark:hover:bg-white/5'
                      }`}>
                      {sel && <Check size={16} strokeWidth={3} />}{op.etiqueta}
                    </button>
                  );
                })}
              </div>

              {pasoActual.subpregunta && respondidas.has(pasoActual.campo) && data[pasoActual.campo] === pasoActual.subpregunta.condicion && (
                <div className="mt-4 rounded-2xl border border-ink-100 bg-ink-50/70 p-4 animate-fade-up dark:border-white/10 dark:bg-white/[0.03]">
                  <p className="mb-3 text-sm font-semibold text-ink-700 dark:text-ink-200">{pasoActual.subpregunta.pregunta}</p>
                  {pasoActual.subpregunta.tipo === 'texto' ? (
                    <input type="text" className="input" placeholder={pasoActual.subpregunta.placeholder}
                      value={data[pasoActual.subpregunta.campo] || ''}
                      onChange={e => set(pasoActual.subpregunta.campo, e.target.value)} />
                  ) : (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {pasoActual.subpregunta.opciones.map(op => {
                        const sel = data[pasoActual.subpregunta.campo] === op.valor;
                        return (
                          <button key={op.valor} type="button" aria-pressed={sel}
                            onClick={() => set(pasoActual.subpregunta.campo, op.valor)}
                            className={`rounded-xl border p-3 text-left transition-all ${
                              sel
                                ? 'border-brand-500 bg-white ring-2 ring-brand-500/20 dark:bg-brand-500/10'
                                : 'border-ink-200 bg-white hover:border-brand-300 dark:border-white/10 dark:bg-transparent'
                            }`}>
                            <p className="text-[13px] font-semibold text-ink-800 dark:text-ink-100">{op.etiqueta}</p>
                            <p className="mt-0.5 text-[11.5px] text-ink-400">{op.desc}</p>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {pasoActual.tipo === 'escala' && (
            <div>
              <SeccionTag paso={pasoActual} />
              <h3 className="mt-4 text-lg font-bold text-ink-900 dark:text-white">{pasoActual.pregunta}</h3>
              {pasoActual.info && <Nota>{pasoActual.info}</Nota>}
              <div className="mt-6">
                <div className="mb-2 flex justify-between text-xs font-medium">
                  <span className="text-brand-600 dark:text-brand-400">Sin dolor</span>
                  <span className="text-red-500">Dolor intenso</span>
                </div>
                <div className="grid grid-cols-11 gap-1.5">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => {
                    const sel = data[pasoActual.campo] === n;
                    const tono = n <= 3 ? 'bg-brand-500 border-brand-500' : n <= 6 ? 'bg-amber-500 border-amber-500' : 'bg-red-500 border-red-500';
                    return (
                      <button key={n} type="button" onClick={() => set(pasoActual.campo, n)} aria-pressed={sel}
                        className={`rounded-lg border-2 py-3 text-xs font-bold tabular-nums transition-all ${
                          sel ? `${tono} text-white` : 'border-ink-100 text-ink-500 hover:border-ink-300 dark:border-white/10 dark:text-ink-400'
                        }`}>{n}</button>
                    );
                  })}
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-gradient-to-r from-brand-400 via-amber-400 to-red-500 opacity-60" />
                <p className="mt-4 text-center text-sm font-semibold text-ink-700 dark:text-ink-200">
                  {data[pasoActual.campo] === 0 ? 'Sin dolor' :
                   data[pasoActual.campo] <= 3 ? 'Dolor leve' :
                   data[pasoActual.campo] <= 6 ? 'Dolor moderado' : 'Dolor intenso'}
                </p>
              </div>
            </div>
          )}

          {pasoActual.tipo === 'resumen' && (
            <div>
              <div className="flex items-center gap-2.5">
                <span className="icon-tile h-9 w-9 bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"><PasoIcon size={18} /></span>
                <h3 className="text-lg font-bold text-ink-900 dark:text-white">{pasoActual.titulo}</h3>
              </div>
              <p className="muted mt-2">Verifica que todo esté correcto antes de confirmar.</p>
              <dl className="mt-4 divide-y divide-ink-100 rounded-2xl border border-ink-100 dark:divide-white/[0.06] dark:border-white/10">
                {resumenItems(data).map(item => (
                  <div key={item.label} className="flex items-center justify-between gap-4 px-4 py-2.5">
                    <dt className="text-[13px] text-ink-500 dark:text-ink-400">{item.label}</dt>
                    <dd className={`text-right text-[13px] font-semibold capitalize ${item.alerta ? 'text-amber-600 dark:text-amber-400' : 'text-ink-800 dark:text-ink-100'}`}>{item.valor}</dd>
                  </div>
                ))}
              </dl>
              <div className={`mt-4 flex items-center gap-3 rounded-2xl p-4 ${
                calcularApto(data) ? 'bg-brand-50 text-brand-800 dark:bg-brand-500/10 dark:text-brand-200' : 'bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-200'
              }`}>
                {calcularApto(data) ? <CircleCheck size={22} className="shrink-0" /> : <TriangleAlert size={22} className="shrink-0" />}
                <p className="text-sm font-semibold">
                  {calcularApto(data)
                    ? 'Apto para ejercicio de alta intensidad'
                    : 'Se recomienda supervisión médica para ejercicio intenso'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Navegación ── */}
        <footer className="flex items-center gap-3 border-t border-ink-100 px-6 py-4 dark:border-white/[0.06]">
          {paso > 0 ? (
            <button type="button" onClick={anterior} className="btn-secondary"><ArrowLeft size={16} /> Anterior</button>
          ) : <span />}
          <div className="flex-1 text-right text-xs text-ink-400">
            {!puedeAvanzar && 'Selecciona una opción para continuar'}
          </div>
          {pasoActual.tipo !== 'resumen' ? (
            <button type="button" onClick={siguiente} disabled={!puedeAvanzar} className="btn-primary">
              {pasoActual.tipo === 'info' ? 'Comenzar' : 'Siguiente'} <ArrowRight size={16} />
            </button>
          ) : (
            <button type="button" onClick={confirmarYEnviar} className="btn-primary">
              <Check size={16} strokeWidth={3} /> Confirmar y enviar
            </button>
          )}
        </footer>
      </div>
  );
};

export default Triaje;
