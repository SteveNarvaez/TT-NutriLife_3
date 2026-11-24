import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Scale, Flame, Dumbbell, CalendarCheck, Loader2 } from 'lucide-react';

// ─── Colores de macronutrientes (definidos en el tema) ─────────────────────
const C = {
  proteina: 'var(--color-protein)',
  carbs:    'var(--color-carb)',
  grasas:   'var(--color-fat)',
};

// Fecha local en formato AAAA-MM-DD (evita el desfase de toISOString, que usa UTC)
const claveLocal = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// ─── Anillo de progreso ────────────────────────────────────────────────────
function Anillo({ pct, size = 140, grosor = 10, label, excedido = false }) {
  const r = 50 - grosor / 2 - 1;
  const circ = 2 * Math.PI * r;
  const visible = Math.min(pct, 100);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={r} className="stroke-ink-100 dark:stroke-white/10" strokeWidth={grosor} fill="none" />
        <circle cx="50" cy="50" r={r} strokeWidth={grosor} fill="none" strokeLinecap="round"
          className={`transition-all duration-700 ${excedido ? 'stroke-amber-500' : 'stroke-brand-500'}`}
          strokeDasharray={`${(visible / 100) * circ} ${circ}`} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold tabular-nums text-ink-900 dark:text-white">{pct}%</span>
        {label && <span className="text-[11px] text-ink-400">{label}</span>}
      </div>
    </div>
  );
}

// ─── Barra de macro ────────────────────────────────────────────────────────
function MacroBarra({ nombre, valor, meta, color }) {
  const pct = meta > 0 ? Math.min(Math.round((valor / meta) * 100), 100) : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="flex items-center gap-2 text-[13px] text-ink-600 dark:text-ink-300">
          <span className="h-2 w-2 rounded-full" style={{ background: color }} />{nombre}
        </span>
        <span className="text-[13px] tabular-nums text-ink-400">
          <strong className="font-semibold text-ink-900 dark:text-white">{valor} g</strong> / {meta} g
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-ink-100 dark:bg-white/10">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

// ─── Tarjeta de indicador ──────────────────────────────────────────────────
function Indicador({ icon: Icon, tono, label, valor, sub }) {
  return (
    <div className="card p-5">
      <span className={`icon-tile ${tono}`}><Icon size={20} /></span>
      <p className="mt-4 text-[24px] font-bold leading-none tracking-tight tabular-nums text-ink-900 dark:text-white">{valor}</p>
      <p className="mt-1.5 text-[13px] text-ink-500 dark:text-ink-400">{label}</p>
      {sub && <p className="mt-0.5 text-xs text-ink-400">{sub}</p>}
    </div>
  );
}

// ─── Calendario de actividad (90 días) ─────────────────────────────────────
function CalendarioRacha({ fechasEntrenadas }) {
  const hoy = new Date();
  const inicio = new Date(hoy);
  inicio.setDate(hoy.getDate() - 89);

  const dias = [];
  for (let d = new Date(inicio); d <= hoy; d.setDate(d.getDate() + 1)) dias.push(new Date(d));

  const primerDiaSemana = inicio.getDay() === 0 ? 6 : inicio.getDay() - 1;
  const todosDias = [...Array(primerDiaSemana).fill(null), ...dias];
  const semanas = [];
  for (let i = 0; i < todosDias.length; i += 7) semanas.push(todosDias.slice(i, i + 7));

  const enSet = new Set((fechasEntrenadas || []).map(f => String(f).slice(0, 10)));
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const diasLabel = ['L', '', 'X', '', 'V', '', 'D'];

  const mesLabels = semanas.map((sem, i) => {
    const primero = sem.find(Boolean);
    if (!primero) return null;
    if (i === 0) return meses[primero.getMonth()];
    const anterior = semanas[i - 1].find(Boolean);
    return anterior && primero.getMonth() !== anterior.getMonth() ? meses[primero.getMonth()] : null;
  });

  return (
    <div className="scroll-thin overflow-x-auto pb-1">
      <div className="inline-block min-w-full">
        <div className="mb-1.5 flex gap-[4px] pl-6">
          {semanas.map((_, i) => (
            <div key={i} className="w-[15px] shrink-0 text-[10px] text-ink-400">{mesLabels[i] || ''}</div>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="flex flex-col gap-[4px]">
            {diasLabel.map((d, i) => <span key={i} className="h-[15px] w-4 text-[10px] leading-[15px] text-ink-400">{d}</span>)}
          </div>
          <div className="flex gap-[4px]">
            {semanas.map((sem, si) => (
              <div key={si} className="flex flex-col gap-[4px]">
                {sem.map((dia, di) => {
                  const activo = dia && enSet.has(claveLocal(dia));
                  const esHoy = dia && claveLocal(dia) === claveLocal(hoy);
                  return (
                    <div key={di} title={dia ? `${dia.toLocaleDateString('es-MX')}${activo ? ' · entrenamiento' : ''}` : ''}
                      className={`h-[15px] w-[15px] rounded-[4px] ${
                        !dia ? 'bg-transparent' : activo ? 'bg-brand-500' : 'bg-ink-100 dark:bg-white/[0.07]'
                      } ${esHoy ? 'ring-2 ring-brand-300 ring-offset-1 ring-offset-white dark:ring-offset-ink-900' : ''}`} />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-3 flex justify-end gap-4 text-xs text-ink-400">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[3px] bg-ink-100 dark:bg-white/10" />Sin actividad</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[3px] bg-brand-500" />Entrenamiento</span>
      </div>
    </div>
  );
}

// ─── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────
const MisGraficas = ({ userId }) => {
  const [macros,     setMacros]     = useState({ proteina: 0, carbohidratos: 0, grasas: 0, calorias: 0 });
  const [stats,      setStats]      = useState({ peso: 0, meta_calorica: 0, entrenamientos_mes: 0, racha_dias: 0 });
  const [racha,      setRacha]      = useState([]);
  const [rachaDias,  setRachaDias]  = useState(0);
  const [cargando,   setCargando]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

const cargar = useCallback(async (esRefresh = false) => {
  const id = userId || localStorage.getItem('userId');
  if (!id) { setCargando(false); return; }
  if (esRefresh) setRefreshing(true);
  try {
    const token = localStorage.getItem('token');  // verify token
    const headers = { Authorization: `Bearer ${token}` };  // verify token
    const [resMacros, resStats, resRacha] = await Promise.all([
      fetch(`${import.meta.env.VITE_API_URL}/api/graficas/macros/${id}`, { headers }),  
      fetch(`${import.meta.env.VITE_API_URL}/api/graficas/stats/${id}`,  { headers }),  
      fetch(`${import.meta.env.VITE_API_URL}/api/graficas/racha/${id}`,  { headers }),  
    ]);
      const [dataMacros, dataStats, dataRacha] = await Promise.all([resMacros.json(), resStats.json(), resRacha.json()]);
      setMacros(dataMacros);
      setStats(dataStats);
      setRacha(dataRacha.fechas || []);
      setRachaDias(dataRacha.racha_consecutiva || 0);
    } catch (err) {
      console.error('Error cargando gráficas:', err);
    } finally {
      setCargando(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => { cargar(); }, [cargar]);

  if (cargando) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 text-ink-400">
        <Loader2 size={30} className="animate-spin text-brand-500" />
        <p className="text-sm">Cargando tus estadísticas…</p>
      </div>
    );
  }

  const metaCal   = Number(stats.meta_calorica) || 0;
  const calHoy    = Number(macros.calorias) || 0;
  const pctCal    = metaCal > 0 ? Math.round((calHoy / metaCal) * 100) : 0;
  const excedido  = pctCal > 100;

  const peso      = Number(stats.peso) || 0;
  const protMeta  = Math.round(peso * 2.0);
  const carbMeta  = Math.round((metaCal * 0.45) / 4);
  const grasaMeta = Math.round((metaCal * 0.25) / 9);

  return (
    <div className="space-y-6 pb-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Estadísticas</p>
          <h1 className="h-page mt-1">Mis gráficas</h1>
        </div>
        <button onClick={() => cargar(true)} disabled={refreshing} className="btn-secondary">
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Actualizando…' : 'Actualizar'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Indicador icon={Scale} tono="bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400"
          label="Peso actual" valor={peso ? `${peso} kg` : '—'} sub="Último registro" />
        <Indicador icon={CalendarCheck} tono="bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
          label="Racha actual" valor={`${rachaDias} ${rachaDias === 1 ? 'día' : 'días'}`}
          sub={rachaDias >= 3 ? '¡Sigue así!' : rachaDias > 0 ? 'Continúa mañana' : 'Entrena hoy para iniciarla'} />
        <Indicador icon={Flame} tono="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
          label="Calorías de hoy" valor={calHoy.toLocaleString('es-MX')} sub={metaCal ? `de ${metaCal.toLocaleString('es-MX')} kcal` : 'Sin meta registrada'} />
        <Indicador icon={Dumbbell} tono="bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400"
          label="Entrenamientos" valor={stats.entrenamientos_mes ?? 0} sub="Este mes" />
      </div>

      <section className="card p-6">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="h-card">Constancia de entrenamiento</h2>
            <p className="muted mt-0.5">Últimos 90 días</p>
          </div>
          <span className="chip-brand">{racha.length} días entrenados</span>
        </div>
        <CalendarioRacha fechasEntrenadas={racha} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-6">
          <h2 className="h-card">Macronutrientes de hoy</h2>
          <p className="muted mt-0.5">Consumo frente a la meta estimada</p>
          {metaCal ? (
            <div className="mt-6 space-y-5">
              <MacroBarra nombre="Proteína"      valor={Number(macros.proteina) || 0}      meta={protMeta}  color={C.proteina} />
              <MacroBarra nombre="Carbohidratos" valor={Number(macros.carbohidratos) || 0} meta={carbMeta}  color={C.carbs} />
              <MacroBarra nombre="Grasas"        valor={Number(macros.grasas) || 0}        meta={grasaMeta} color={C.grasas} />
            </div>
          ) : (
            <p className="mt-6 rounded-xl bg-ink-50 p-4 text-sm text-ink-500 dark:bg-white/5">
              Completa tu evaluación física con el asistente para calcular tus metas de macronutrientes.
            </p>
          )}
        </section>

        <section className="card p-6">
          <h2 className="h-card">Progreso calórico</h2>
          <p className="muted mt-0.5">{metaCal ? `Meta diaria: ${metaCal.toLocaleString('es-MX')} kcal` : 'Sin meta registrada'}</p>
          <div className="mt-5 flex flex-col items-center gap-5 sm:flex-row">
            <Anillo pct={pctCal} label={excedido ? 'sobre la meta' : 'de la meta'} excedido={excedido} />
            <dl className="grid w-full flex-1 grid-cols-3 gap-2 sm:grid-cols-1">
              {[
                ['Consumidas', calHoy.toLocaleString('es-MX'), 'text-ink-900 dark:text-white'],
                [excedido ? 'Excedente' : 'Restantes', Math.abs(metaCal - calHoy).toLocaleString('es-MX'), excedido ? 'text-amber-600' : 'text-brand-600 dark:text-brand-400'],
                ['Meta', metaCal.toLocaleString('es-MX'), 'text-ink-900 dark:text-white'],
              ].map(([l, v, c]) => (
                <div key={l} className="flex flex-col rounded-xl bg-ink-50 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between dark:bg-white/5">
                  <dt className="text-xs text-ink-400">{l}</dt>
                  <dd className={`text-sm font-semibold tabular-nums ${c}`}>{v} <span className="text-xs font-normal text-ink-400">kcal</span></dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </div>
    </div>
  );
};

export default MisGraficas;
