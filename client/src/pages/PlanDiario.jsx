import React, { useState, useEffect } from 'react';

const API = `${import.meta.env.VITE_API_URL}/api`;

const PlanDiario = ({ userId }) => {
  const uid = userId || localStorage.getItem('userId') || '1';

  const [tareas, setTareas] = useState([
    { id: 1, tipo: 'agua',     titulo: 'Calculando tu requerimiento...', completado: false, icono: '💧' },
    { id: 2, tipo: 'dieta',    titulo: 'Desayuno Proteico',              completado: false, icono: '🍳' },
    { id: 3, tipo: 'dieta',    titulo: 'Comida Equilibrada',             completado: false, icono: '🥗' },
    { id: 4, tipo: 'dieta',    titulo: 'Cena Ligera',                    completado: false, icono: '🌙' },
    { id: 5, tipo: 'ejercicio',titulo: 'Rutina del Día',                 completado: false, icono: '🏋️' },
  ]);

  // null = aún cargando | false = no guardado hoy | number = % ya guardado hoy
  const [yaGuardadoHoy, setYaGuardadoHoy] = useState(null);
  const [guardando, setGuardando]         = useState(false);
  const [errorMsg, setErrorMsg]           = useState('');

  const tareasCompletadas = tareas.filter(t => t.completado).length;
  const progreso = Math.round((tareasCompletadas / tareas.length) * 100);

  // ── Al montar: peso para el agua + estado de hoy ──────────────────────────
  useEffect(() => {
    const init = async () => {
      // 1. Calcular litros de agua según peso
      try {
        const r = await fetch(`${API}/usuario/peso/${uid}`);
        const d = await r.json();
        const litros = (d.peso * 0.035).toFixed(1);
        setTareas(prev => prev.map(t =>
          t.tipo === 'agua' ? { ...t, titulo: `Tomar ${litros} Litros de Agua` } : t
        ));
      } catch { /* peso no crítico */ }

      // 2. Ver si ya guardó hoy → bloquear si es así
      try {
        const r = await fetch(`${API}/constancia/hoy/${uid}`);
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
            headers: { 'Content-Type': 'application/json' },
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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_usuario: uid, momento_dia: momento }),
          }).catch(() => {}); // no crítico si falla uno
        })
      );

      // 2. Guardar porcentaje de constancia
      const r1 = await fetch(`${API}/constancia/guardar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_usuario: uid, porcentaje: progreso }),
      });
      if (!r1.ok) throw new Error('Error al guardar constancia');

      // 3. Registrar entrenamiento si marcó la rutina
      const hizoEjercicio = tareas.find(t => t.tipo === 'ejercicio')?.completado;
      if (hizoEjercicio) {
        await fetch(`${API}/rutina/registrar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
      <div className="max-w-3xl mx-auto p-6 flex items-center justify-center" style={{ minHeight: 300 }}>
        <div style={{ textAlign: 'center', color: '#9ca3af' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
          <p>Cargando tu plan diario…</p>
        </div>
      </div>
    );
  }

  const bloqueado = yaGuardadoHoy !== false;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-3xl font-extrabold text-green-800 mb-2">Tu Plan Diario</h2>
      <p className="text-gray-500 mb-8">
        {bloqueado
          ? '✅ Ya registraste tu progreso de hoy. ¡Vuelve mañana!'
          : 'Marca tus objetivos conforme avance tu día para mantener tu racha.'}
      </p>

      {/* BARRA DE PROGRESO */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="font-semibold text-gray-700">Progreso de hoy</span>
          <span className="font-bold text-green-600">
            {bloqueado ? `${yaGuardadoHoy}%` : `${progreso}%`}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className="bg-green-500 h-4 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${bloqueado ? yaGuardadoHoy : progreso}%` }}
          />
        </div>
        {(bloqueado ? yaGuardadoHoy : progreso) === 100 && (
          <p className="text-sm text-center text-green-600 mt-4 font-bold animate-pulse">
            ¡Felicidades! Has completado tu plan del día. 🎉
          </p>
        )}
      </div>

      {/* LISTA DE TAREAS */}
      <div className="space-y-4 mb-8">
        {tareas.map((tarea) => (
          <div
            key={tarea.id}
            onClick={() => toggleTarea(tarea.id)}
            className={`flex items-center justify-between p-4 rounded-xl transition-all border-2 ${
              bloqueado
                ? 'cursor-not-allowed opacity-70 bg-gray-50 border-gray-100'
                : tarea.completado
                  ? 'cursor-pointer bg-green-50 border-green-200 opacity-75'
                  : 'cursor-pointer bg-white border-transparent hover:border-green-100 shadow-sm'
            }`}
          >
            <div className="flex items-center gap-4">
              <span className="text-2xl">{tarea.icono}</span>
              <span className={`font-medium text-lg ${
                tarea.completado ? 'line-through text-gray-400' : 'text-gray-700'
              }`}>
                {tarea.titulo}
              </span>
            </div>

            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
              tarea.completado ? 'bg-green-500 border-green-500' : 'border-gray-300'
            }`}>
              {tarea.completado && <span className="text-white text-xl">✓</span>}
            </div>
          </div>
        ))}
      </div>

      {/* BOTÓN / ESTADO GUARDADO */}
      <div className="flex flex-col items-center">
        {bloqueado ? (
          /* ── Ya registró hoy: muestra bloque informativo ── */
          <div style={{
            width: '100%',
            background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
            border: '2px solid #bbf7d0',
            borderRadius: 16,
            padding: '20px 24px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
            <p style={{ fontWeight: 700, color: '#15803d', fontSize: 16, marginBottom: 4 }}>
              ¡Progreso guardado!
            </p>
            <p style={{ color: '#4b5563', fontSize: 13 }}>
              Registraste <strong>{yaGuardadoHoy}%</strong> de constancia hoy.
              Podrás actualizar tu plan mañana.
            </p>
          </div>
        ) : (
          /* ── Aún no ha guardado: botón activo ── */
          <>
            <button
              onClick={handleGuardarProgreso}
              disabled={guardando}
              className="w-full md:w-auto px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
            >
              {guardando ? 'Guardando…' : 'Guardar mi progreso del día 🚀'}
            </button>

            {errorMsg && (
              <p className="text-red-500 mt-3 font-medium text-sm">{errorMsg}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PlanDiario;