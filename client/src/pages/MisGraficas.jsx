import React, { useState, useEffect } from 'react';

// ─── Colores base ──────────────────────────────────────────────────────────
const C = {
  verde:       '#16a34a',
  verdeClaro:  '#86efac',
  verdeOscuro: '#14532d',
  grisClaro:   '#e5e7eb',
  proteina:    '#2a78d6',
  carbs:       '#1baf7a',
  grasas:      '#eb6834',
};

// ─── Dona SVG simple (sin librería) ───────────────────────────────────────
function Dona({ pct, color, size = 120, label }) {
  const r = 40;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e7eb" strokeWidth={10} />
        <circle
          cx={cx} cy={cy} r={r} fill="none"
          stroke={color} strokeWidth={10}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
        />
      </svg>
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)', textAlign: 'center'
      }}>
        <p style={{ fontSize: 18, fontWeight: 500, margin: 0, color: '#111' }}>{pct}%</p>
        {label && <p style={{ fontSize: 10, color: '#9ca3af', margin: 0 }}>{label}</p>}
      </div>
    </div>
  );
}

// ─── Barra de macro ────────────────────────────────────────────────────────
function MacroBarra({ nombre, valor, meta, color }) {
  const pct = meta > 0 ? Math.min(Math.round((valor / meta) * 100), 100) : 0;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
          {nombre}
        </span>
        <span style={{ fontSize: 12, fontWeight: 500, color: '#111' }}>{valor}g</span>
      </div>
      <div style={{ height: 5, background: '#e5e7eb', borderRadius: 3 }}>
        <div style={{ height: 5, width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  );
}

// ─── Tarjeta de stat ───────────────────────────────────────────────────────
function StatCard({ label, valor, sub, subColor = '#9ca3af' }) {
  return (
    <div style={{
      background: '#f9fafb', borderRadius: 10, padding: '14px 16px',
      border: '1px solid #f0f0f0'
    }}>
      <p style={{ fontSize: 11, color: '#9ca3af', margin: '0 0 4px' }}>{label}</p>
      <p style={{ fontSize: 22, fontWeight: 500, color: '#111', margin: 0 }}>{valor}</p>
      {sub && <p style={{ fontSize: 11, color: subColor, margin: '4px 0 0' }}>{sub}</p>}
    </div>
  );
}

// ─── Calendario de racha ───────────────────────────────────────────────────
function CalendarioRacha({ fechasEntrenadas }) {
  const hoy = new Date();
  const inicio = new Date(hoy);
  inicio.setDate(hoy.getDate() - 89);

  const dias = [];
  for (let d = new Date(inicio); d <= hoy; d.setDate(d.getDate() + 1)) {
    dias.push(new Date(d));
  }

  // Completar primera semana con días vacíos
  const primerDiaSemana = inicio.getDay() === 0 ? 6 : inicio.getDay() - 1;
  const padding = Array(primerDiaSemana).fill(null);
  const todosDias = [...padding, ...dias];

  // Agrupar en semanas
  const semanas = [];
  for (let i = 0; i < todosDias.length; i += 7) {
    semanas.push(todosDias.slice(i, i + 7));
  }

  const enSet = new Set(fechasEntrenadas);

  const getColor = (fecha) => {
    if (!fecha) return 'transparent';
    const key = fecha.toISOString().split('T')[0];
    return enSet.has(key) ? C.verde : '#e5e7eb';
  };

  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const diasLabel = ['L','M','X','J','V','S','D'];

  // Calcular qué semanas tienen cambio de mes para los labels
  const mesLabels = semanas.map((sem, i) => {
    const primerDia = sem.find(d => d !== null);
    if (!primerDia) return null;
    if (i === 0) return meses[primerDia.getMonth()];
    const semAnterior = semanas[i - 1];
    const primerAnterior = semAnterior.find(d => d !== null);
    if (primerAnterior && primerDia.getMonth() !== primerAnterior.getMonth()) {
      return meses[primerDia.getMonth()];
    }
    return null;
  });

  return (
    <div>
      {/* Labels de meses */}
      <div style={{ display: 'flex', gap: 3, marginBottom: 4, paddingLeft: 20 }}>
        {semanas.map((_, i) => (
          <div key={i} style={{ width: 13, fontSize: 10, color: '#9ca3af', flexShrink: 0 }}>
            {mesLabels[i] || ''}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
        {/* Días de semana */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, paddingTop: 1 }}>
          {diasLabel.map(d => (
            <span key={d} style={{ fontSize: 9, color: '#9ca3af', height: 13, lineHeight: '13px' }}>{d}</span>
          ))}
        </div>

        {/* Grid */}
        <div style={{ display: 'flex', gap: 3, flex: 1, flexWrap: 'nowrap', overflowX: 'auto' }}>
          {semanas.map((sem, si) => (
            <div key={si} style={{ display: 'flex', flexDirection: 'column', gap: 3, flexShrink: 0 }}>
              {sem.map((dia, di) => (
                <div
                  key={di}
                  title={dia ? dia.toLocaleDateString('es-MX') : ''}
                  style={{
                    width: 13, height: 13, borderRadius: 2,
                    background: getColor(dia),
                    cursor: dia ? 'default' : 'default'
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Leyenda */}
      <div style={{ display: 'flex', gap: 12, marginTop: 10, justifyContent: 'flex-end', fontSize: 11, color: '#9ca3af' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: '#e5e7eb', display: 'inline-block' }} />
          Sin actividad
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: C.verde, display: 'inline-block' }} />
          Entrenamiento
        </span>
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

  const cargar = async (esRefresh = false) => {
    const id = userId || localStorage.getItem('userId') || '1';
    if (esRefresh) setRefreshing(true);
    try {
      const [resMacros, resStats, resRacha] = await Promise.all([
        fetch(`http://localhost:3000/api/graficas/macros/${id}`),
        fetch(`http://localhost:3000/api/graficas/stats/${id}`),
        fetch(`http://localhost:3000/api/graficas/racha/${id}`),
      ]);
      const [dataMacros, dataStats, dataRacha] = await Promise.all([
        resMacros.json(), resStats.json(), resRacha.json()
      ]);
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
  };

  useEffect(() => { cargar(); }, [userId]);

  if (cargando) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
        <p style={{ color: '#9ca3af', fontSize: 14 }}>Cargando tus estadísticas...</p>
      </div>
    );
  }

  const metaCal   = Number(stats.meta_calorica) || 2244;
  const calHoy    = Number(macros.calorias) || 0;
  const pctCal    = Math.min(Math.round((calHoy / metaCal) * 100), 100);

  const protMeta  = Math.round(Number(stats.peso) * 2.0) || 120;
  const carbMeta  = Math.round((metaCal * 0.45) / 4) || 250;
  const grasaMeta = Math.round((metaCal * 0.25) / 9) || 60;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 32 }}>

      {/* ── HEADER CON BOTÓN REFRESH ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#14532d', margin: 0 }}>Mis Gráficas</h2>
          <p style={{ fontSize: 13, color: '#9ca3af', margin: '2px 0 0' }}>Estadísticas de hoy</p>
        </div>
        <button
          onClick={() => cargar(true)}
          disabled={refreshing}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 10, border: '1px solid #d1fae5',
            background: refreshing ? '#f9fafb' : '#f0fdf4',
            color: '#16a34a', fontSize: 13, fontWeight: 500,
            cursor: refreshing ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <span style={{
            display: 'inline-block',
            animation: refreshing ? 'spin 0.8s linear infinite' : 'none',
          }}>🔄</span>
          {refreshing ? 'Actualizando…' : 'Actualizar'}
        </button>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── TARJETAS RESUMEN ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <StatCard
          label="Peso actual"
          valor={`${stats.peso} kg`}
          sub="último registro"
        />
        <StatCard
          label="Racha actual"
          valor={`${rachaDias} días`}
          sub={rachaDias >= 3 ? '🔥 ¡Sigue así!' : rachaDias > 0 ? '¡Continúa mañana!' : 'Entrena hoy'}
          subColor={rachaDias >= 3 ? '#16a34a' : '#9ca3af'}
        />
        <StatCard
          label="Calorías hoy"
          valor={calHoy.toLocaleString()}
          sub={`/ ${metaCal.toLocaleString()} kcal meta`}
        />
        <StatCard
          label="Entrenamientos"
          valor={stats.entrenamientos_mes}
          sub="este mes"
        />
      </div>

      {/* ── RACHA DE ENTRENAMIENTOS ── */}
      <div style={{
        background: '#fff', borderRadius: 16, padding: '20px 24px',
        border: '1px solid #f0f0f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#14532d', margin: '0 0 2px' }}>
              Racha de entrenamientos
            </h2>
            <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>Últimos 90 días</p>
          </div>
          <div style={{
            background: '#f0fdf4', color: '#16a34a', borderRadius: 8,
            padding: '4px 10px', fontSize: 12, fontWeight: 500
          }}>
            {racha.length} días entrenados
          </div>
        </div>
        <CalendarioRacha fechasEntrenadas={racha} />
      </div>

      {/* ── MACROS + CALORÍAS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Macros del día */}
        <div style={{
          background: '#fff', borderRadius: 16, padding: '20px 24px',
          border: '1px solid #f0f0f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111', margin: '0 0 2px' }}>Macros de hoy</h2>
          <p style={{ fontSize: 12, color: '#9ca3af', margin: '0 0 20px' }}>Distribución de nutrientes</p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20 }}>
            <Dona
              pct={pctCal}
              color={C.verde}
              size={90}
              label="kcal"
            />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <MacroBarra nombre="Proteína"      valor={Number(macros.proteina) || 0}      meta={protMeta}  color={C.proteina} />
              <MacroBarra nombre="Carbohidratos" valor={Number(macros.carbohidratos) || 0} meta={carbMeta}  color={C.carbs}    />
              <MacroBarra nombre="Grasas"        valor={Number(macros.grasas) || 0}        meta={grasaMeta} color={C.grasas}   />
            </div>
          </div>

          <div style={{
            display: 'flex', justifyContent: 'space-between',
            background: '#f9fafb', borderRadius: 8, padding: '10px 14px'
          }}>
            {[
              { label: 'Proteína',      val: `${macros.proteina || 0}g`,      color: C.proteina },
              { label: 'Carbohidratos', val: `${macros.carbohidratos || 0}g`, color: C.carbs    },
              { label: 'Grasas',        val: `${macros.grasas || 0}g`,        color: C.grasas   },
            ].map(m => (
              <div key={m.label} style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 11, color: '#9ca3af', margin: '0 0 2px' }}>{m.label}</p>
                <p style={{ fontSize: 14, fontWeight: 500, color: m.color, margin: 0 }}>{m.val}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Progreso calórico */}
        <div style={{
          background: '#fff', borderRadius: 16, padding: '20px 24px',
          border: '1px solid #f0f0f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111', margin: '0 0 2px' }}>Progreso calórico</h2>
          <p style={{ fontSize: 12, color: '#9ca3af', margin: '0 0 20px' }}>Meta diaria: {metaCal.toLocaleString()} kcal</p>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <Dona pct={pctCal} color={C.verde} size={130} label="completado" />
          </div>

          <div style={{
            display: 'flex', justifyContent: 'space-between',
            background: '#f9fafb', borderRadius: 8, padding: '10px 14px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 11, color: '#9ca3af', margin: '0 0 2px' }}>Consumidas</p>
              <p style={{ fontSize: 14, fontWeight: 500, color: '#111', margin: 0 }}>{calHoy.toLocaleString()}</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 11, color: '#9ca3af', margin: '0 0 2px' }}>Restantes</p>
              <p style={{ fontSize: 14, fontWeight: 500, color: '#16a34a', margin: 0 }}>
                {Math.max(metaCal - calHoy, 0).toLocaleString()}
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 11, color: '#9ca3af', margin: '0 0 2px' }}>Meta</p>
              <p style={{ fontSize: 14, fontWeight: 500, color: '#111', margin: 0 }}>{metaCal.toLocaleString()}</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default MisGraficas;