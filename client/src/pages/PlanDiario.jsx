import { useState, useEffect } from 'react';
import { GlassWater, Sunrise, Sun, Moon, Dumbbell, Check, Loader2, CircleCheck, CircleAlert, Save } from 'lucide-react';

const API = `${import.meta.env.VITE_API_URL}/api`;

const PlanDiario = ({ userId }) => {
  const uid = userId || localStorage.getItem('userId');

  const [tareas, setTareas] = useState([
    { id: 1, tipo: 'agua',     titulo: 'Calculando tu requerimiento...', completado: false, icono: GlassWater, tono: 'sky', detalle: 'Hidratación calculada con tu peso' },
    { id: 2, tipo: 'dieta',    titulo: 'Desayuno Proteico',              completado: false, icono: Sunrise, tono: 'amber', detalle: 'Primera comida del día' },
    { id: 3, tipo: 'dieta',    titulo: 'Comida Equilibrada',             completado: false, icono: Sun, tono: 'brand', detalle: 'Comida principal' },
    { id: 4, tipo: 'dieta',    titulo: 'Cena Ligera',                    completado: false, icono: Moon, tono: 'violet', detalle: 'Última comida del día' },
    { id: 5, tipo: 'ejercicio',titulo: 'Rutina del Día',                 completado: false, icono: Dumbbell, tono: 'rose', detalle: 'Pídela al asistente: «mi rutina de hoy»' },
  ]);

  // null = aún cargando | false = no guardado hoy | number = % ya guardado hoy
  const [yaGuardadoHoy, setYaGuardadoHoy] = useState(null);
  const [guardando, setGuardando]         = useState(false);
  const [errorMsg, setErrorMsg]           = useState('');

  const tareasCompletadas = tareas.filter(t => t.completado).length;
  const progreso = Math.round((tareasCompletadas / tareas.length) * 100);

  // ── Al montar: peso para el agua + estado de hoy ──────────────────────────
  useEffect(() => {
    if (!uid) { setYaGuardadoHoy(false); return; }
    const init = async () => {
      // 1. Calcular litros de agua según peso
      try {
        const r = await fetch(`${API}/usuario/peso/${uid}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        const d = await r.json();
        const peso = Number(d.peso);
        const titulo = peso > 0
          ? `Tomar ${(peso * 0.035).toFixed(1)} litros de agua`
          : 'Mantente hidratado durante el día';
        setTareas(prev => prev.map(t => t.tipo === 'agua' ? { ...t, titulo } : t));
      } catch { /* peso no crítico */ }

      // 2. Ver si ya guardó hoy → bloquear si es así
      try {
        const r = await fetch(`${API}/constancia/hoy/${uid}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        const d = await r.json();
        if (d.yaGuardado) {
          setYaGuardadoHoy(d.porcentaje);
          // Marcar todas las tareas como completadas visualmente (solo UI)
          setTareas(prev => prev.map(t => ({ ...t, completado: true })));
        } else {
          setYaGuardadoHoy(false);
        }
      } catch {
        setYaGuardadoHoy(false);
      }
    };
    init();
  }, [uid]);

  // ── Toggle de tarea (bloqueado si ya guardó hoy) ──────────────────────────
  const toggleTarea = async (id) => {
    if (yaGuardadoHoy !== false) return; // bloqueado

    const tarea = tareas.find(t => t.id === id);
    const nuevoEstado = !tarea.completado;

    setTareas(prev => prev.map(t => t.id === id ? { ...t, completado: nuevoEstado } : t));

    // Registrar comida en diario si se marcó como completada
    if (tarea.tipo === 'dieta' && nuevoEstado) {
      const momentoMap = {
        'Desayuno Proteico': 'Desayuno',
        'Comida Equilibrada': 'Comida',
        'Cena Ligera': 'Cena',
      };
      const momento = momentoMap[tarea.titulo];
      if (momento) {
        try {
          await fetch(`${API}/plandiario/registrar-comida`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
          body: JSON.stringify({ id_usuario: uid, momento_dia: momento }),
        });
        } catch { /* no crítico */ }
      }
    }
  };

  // ── Guardar progreso del día ───────────────────────────────────────────────
  const handleGuardarProgreso = async () => {
    if (guardando || yaGuardadoHoy !== false) return;
    setGuardando(true);
    setErrorMsg('');

    try {
      // 1. Registrar todas las comidas marcadas en diario_alimentos
      //    (así aunque el toggle haya fallado antes, queda registrado aquí)
      const momentoMap = {
        'Desayuno Proteico': 'Desayuno',
        'Comida Equilibrada': 'Comida',
        'Cena Ligera':        'Cena',
      };
      const comidasMarcadas = tareas.filter(t => t.tipo === 'dieta' && t.completado);
      await Promise.all(
        comidasMarcadas.map(t => {
          const momento = momentoMap[t.titulo];
          if (!momento) return Promise.resolve();
          return fetch(`${API}/plandiario/registrar-comida`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
          body: JSON.stringify({ id_usuario: uid, momento_dia: momento }),
        }).catch(() => {});
        })
      );

      // 2. Guardar porcentaje de constancia
      const r1 = await fetch(`${API}/constancia/guardar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify({ id_usuario: uid, porcentaje: progreso }),
    });
      if (!r1.ok) throw new Error('Error al guardar constancia');

      // 3. Registrar entrenamiento si marcó la rutina
      const hizoEjercicio = tareas.find(t => t.tipo === 'ejercicio')?.completado;
      if (hizoEjercicio) {
        await fetch(`${API}/rutina/registrar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ id_usuario: uid }),
      });
      }

      // ✅ Marcar como ya guardado → bloquea la UI hasta mañana
      setYaGuardadoHoy(progreso);
    } catch (err) {
      setErrorMsg('No se pudo guardar. Intenta de nuevo.');
      console.error(err);
    } finally {
      setGuardando(false);
    }
  };

  // ── Estados de carga ───────────────────────────────────────────────────────
  if (yaGuardadoHoy === null) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 text-ink-400">
        <Loader2 size={30} className="animate-spin text-brand-500" />
        <p className="text-sm">Cargando tu plan diario…</p>
      </div>
    );
  }

  const bloqueado = yaGuardadoHoy !== false;
  const pct = bloqueado ? yaGuardadoHoy : progreso;
  const r = 44, circ = 2 * Math.PI * r;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Resumen del día */}
      <section className="card flex flex-col items-center gap-6 p-6 sm:flex-row sm:p-7">
        <div className="relative h-32 w-32 shrink-0">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle cx="50" cy="50" r={r} className="stroke-ink-100 dark:stroke-white/10" strokeWidth="8" fill="none" />
            <circle cx="50" cy="50" r={r} className="stroke-brand-500 transition-all duration-700" strokeWidth="8" fill="none"
              strokeLinecap="round" strokeDasharray={`${(pct / 100) * circ} ${circ}`} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold tabular-nums text-ink-900 dark:text-white">{pct}%</span>
            <span className="text-[11px] text-ink-400">completado</span>
          </div>
        </div>
        <div className="text-center sm:text-left">
          <p className="eyebrow">{new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <h1 className="h-page mt-1">Tu plan diario</h1>
          <p className="muted mt-1.5">
            {bloqueado
              ? 'Ya registraste tu progreso de hoy. Vuelve mañana para un nuevo plan.'
              : 'Marca tus objetivos conforme avance el día y guarda tu progreso para mantener tu racha.'}
          </p>
          <p className="mt-3 text-sm font-medium text-ink-600 dark:text-ink-300">
            {bloqueado ? 'Progreso guardado' : `${tareasCompletadas} de ${tareas.length} objetivos`}
          </p>
        </div>
      </section>

      {/* Lista de objetivos */}
      <section className="card divide-y divide-ink-100 overflow-hidden dark:divide-white/[0.06]">
        {tareas.map((tarea) => {
          const Icon = tarea.icono;
          const tonos = {
            sky: 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400',
            amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
            brand: 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400',
            violet: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400',
            rose: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400',
          };
          return (
            <button key={tarea.id} type="button" onClick={() => toggleTarea(tarea.id)} disabled={bloqueado}
              aria-pressed={tarea.completado}
              className={`flex w-full items-center gap-4 px-5 py-4 text-left transition-colors ${
                bloqueado ? 'cursor-default opacity-80' : 'hover:bg-ink-50/70 dark:hover:bg-white/[0.03]'
              }`}>
              <span className={`icon-tile ${tonos[tarea.tono]}`}><Icon size={20} /></span>
              <span className="min-w-0 flex-1">
                <span className={`block font-semibold ${tarea.completado ? 'text-ink-400 line-through decoration-ink-300' : 'text-ink-900 dark:text-white'}`}>
                  {tarea.titulo}
                </span>
                <span className="block text-[13px] text-ink-400">{tarea.detalle}</span>
              </span>
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                tarea.completado ? 'border-brand-600 bg-brand-600 text-white' : 'border-ink-200 dark:border-white/20'
              }`}>
                {tarea.completado && <Check size={15} strokeWidth={3} />}
              </span>
            </button>
          );
        })}
      </section>

      {/* Guardar / estado */}
      {bloqueado ? (
        <div className="flex items-center gap-4 rounded-2xl border border-brand-200 bg-brand-50 p-5 dark:border-brand-500/30 dark:bg-brand-500/10">
          <CircleCheck size={28} className="shrink-0 text-brand-600 dark:text-brand-400" />
          <div>
            <p className="font-semibold text-brand-900 dark:text-brand-100">Progreso guardado</p>
            <p className="text-sm text-brand-800/80 dark:text-brand-200/80">
              Registraste <strong>{yaGuardadoHoy}%</strong> de constancia hoy. Podrás actualizar tu plan mañana.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <p className="text-[13px] text-ink-400">Al guardar, tu progreso de hoy queda registrado y el plan se bloquea hasta mañana.</p>
          <button onClick={handleGuardarProgreso} disabled={guardando} className="btn-primary btn-lg w-full shrink-0 sm:w-auto">
            {guardando ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {guardando ? 'Guardando…' : 'Guardar mi progreso'}
          </button>
        </div>
      )}
      {errorMsg && (
        <p role="alert" className="flex items-center justify-center gap-2 text-sm font-medium text-red-600"><CircleAlert size={16} /> {errorMsg}</p>
      )}
    </div>
  );
};

export default PlanDiario;
