import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

// ─── Estilos inyectados una sola vez ───────────────────────────────────────
const STYLES = `
  .nl-chat-root {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #fff;
    border-radius: 20px;
    border: 1px solid #e5e7eb;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }

  /* HEADER */
  .nl-header {
    padding: 14px 18px;
    background: #fff;
    border-bottom: 1px solid #f0f0f0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  }
  .nl-header-left { display: flex; align-items: center; gap: 11px; }
  .nl-avatar {
    width: 38px; height: 38px; border-radius: 50%;
    background: linear-gradient(135deg, #16a34a, #0d9488);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; font-size: 18px;
  }
  .nl-header-title { font-size: 14.5px; font-weight: 700; color: #111; }
  .nl-header-sub { font-size: 11.5px; color: #9ca3af; margin-top: 1px; display: flex; align-items: center; gap: 5px; }
  .nl-dot { width: 6px; height: 6px; border-radius: 50%; background: #22c55e; display: inline-block; }
  .nl-clear-btn {
    padding: 6px 12px; border-radius: 8px; border: 1px solid #e5e7eb;
    background: none; cursor: pointer; font-size: 12px; color: #6b7280;
    display: flex; align-items: center; gap: 5px;
    transition: background 0.15s, color 0.15s;
  }
  .nl-clear-btn:hover { background: #f9fafb; color: #374151; }

  /* QUICK CHIPS */
  .nl-chips {
    padding: 9px 14px;
    display: flex; gap: 7px; overflow-x: auto;
    scrollbar-width: none;
    border-bottom: 1px solid #f0f0f0;
    flex-shrink: 0;
  }
  .nl-chips::-webkit-scrollbar { display: none; }
  .nl-chip {
    white-space: nowrap; padding: 5px 12px; border-radius: 20px;
    border: 1px solid #e5e7eb; background: #f9fafb;
    font-size: 12px; color: #6b7280; cursor: pointer;
    display: flex; align-items: center; gap: 5px;
    transition: all 0.15s; flex-shrink: 0;
  }
  .nl-chip:hover { border-color: #16a34a; color: #16a34a; background: #f0fdf4; }

  /* MESSAGES */
  .nl-messages {
    flex: 1; overflow-y: auto;
    padding: 16px; display: flex;
    flex-direction: column; gap: 12px;
    scroll-behavior: smooth;
    background: #fafafa;
  }
  .nl-messages::-webkit-scrollbar { width: 4px; }
  .nl-messages::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }

  .nl-timestamp {
    text-align: center; font-size: 11px; color: #d1d5db;
    margin: 4px 0;
  }

  .nl-row { display: flex; gap: 8px; align-items: flex-start; }
  .nl-row.nl-user { flex-direction: row-reverse; }

  .nl-msg-avatar {
    width: 28px; height: 28px; border-radius: 50%;
    background: linear-gradient(135deg, #16a34a, #0d9488);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; font-size: 14px; margin-top: 2px;
  }

  .nl-bubble {
    max-width: 78%; padding: 10px 14px;
    border-radius: 16px; font-size: 13.5px; line-height: 1.65;
    animation: nlFadeUp 0.22s ease;
  }
  .nl-bubble.nl-bot {
    background: #fff; border: 1px solid #e5e7eb;
    color: #1f2937; border-top-left-radius: 4px;
  }
  .nl-bubble.nl-user {
    background: #16a34a; color: #fff;
    border-top-right-radius: 4px;
  }

  /* ═══════════════════════════════════════
     TARJETA DE RUTINA
  ═══════════════════════════════════════ */
  .nl-card-rutina {
    max-width: 88%;
    border-radius: 16px; border-top-left-radius: 4px;
    border: 1px solid #e5e7eb; overflow: hidden;
    background: #fff; animation: nlFadeUp 0.22s ease;
  }
  .nl-rutina-header {
    background: linear-gradient(135deg, #15803d, #0f766e);
    padding: 11px 14px;
    display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  }
  .nl-rutina-badge {
    font-size: 10px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase;
    padding: 2px 8px; border-radius: 20px;
    background: rgba(255,255,255,0.2); color: #fff;
  }
  .nl-rutina-title { font-size: 13.5px; font-weight: 700; color: #fff; flex: 1; min-width: 0; }
  .nl-rutina-dia   { font-size: 11px; color: rgba(255,255,255,0.75); }

  .nl-ejercicio-row {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 14px; border-bottom: 1px solid #f5f5f5;
  }
  .nl-ejercicio-row:last-child { border-bottom: none; }
  .nl-ej-num {
    width: 22px; height: 22px; border-radius: 50%;
    background: #f0fdf4; border: 1px solid #dcfce7;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700; color: #16a34a;
    flex-shrink: 0;
  }
  .nl-ej-info { flex: 1; min-width: 0; }
  .nl-ej-nombre { font-size: 12.5px; font-weight: 600; color: #1f2937; }
  .nl-ej-musculo { font-size: 10.5px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 1px; }
  .nl-ej-pills { display: flex; gap: 5px; flex-shrink: 0; }
  .nl-pill {
    font-size: 11px; font-weight: 600;
    padding: 2px 8px; border-radius: 20px;
    background: #f0fdf4; color: #16a34a;
    border: 1px solid #dcfce7;
    white-space: nowrap;
  }
  .nl-pill.grey { background: #f9fafb; color: #6b7280; border-color: #e5e7eb; }

  .nl-rutina-footer {
    padding: 8px 14px; background: #fafafa;
    border-top: 1px solid #f0f0f0;
    font-size: 11.5px; color: #9ca3af;
    display: flex; align-items: center; gap: 5px;
  }

  .nl-descanso {
    padding: 18px 14px; text-align: center;
    font-size: 13px; color: #6b7280;
  }
  .nl-descanso-icon { font-size: 28px; margin-bottom: 6px; }

  /* ═══════════════════════════════════════
     TARJETA DE DIETA
  ═══════════════════════════════════════ */
  .nl-card-dieta {
    max-width: 88%;
    border-radius: 16px; border-top-left-radius: 4px;
    border: 1px solid #e5e7eb; overflow: hidden;
    background: #fff; animation: nlFadeUp 0.22s ease;
  }
  .nl-dieta-header {
    background: linear-gradient(135deg, #d97706, #16a34a);
    padding: 11px 14px;
    display: flex; align-items: center; justify-content: space-between;
    gap: 10px;
  }
  .nl-dieta-title { font-size: 13.5px; font-weight: 700; color: #fff; }
  .nl-dieta-kcal-wrap { text-align: right; }
  .nl-dieta-kcal { font-size: 20px; font-weight: 800; color: #fff; line-height: 1.1; }
  .nl-dieta-kcal-label { font-size: 10px; color: rgba(255,255,255,0.75); }

  .nl-macros-row {
    display: grid; grid-template-columns: repeat(3, 1fr);
    border-bottom: 1px solid #f0f0f0;
  }
  .nl-macro-cell {
    padding: 9px 8px; text-align: center;
    border-right: 1px solid #f0f0f0;
  }
  .nl-macro-cell:last-child { border-right: none; }
  .nl-macro-val { font-size: 15px; font-weight: 700; }
  .nl-macro-val.prot { color: #f97316; }
  .nl-macro-val.carb { color: #8b5cf6; }
  .nl-macro-val.fat  { color: #f59e0b; }
  .nl-macro-lbl { font-size: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 1px; }

  .nl-comida-row {
    display: flex; align-items: flex-start; gap: 10px;
    padding: 10px 14px; border-bottom: 1px solid #f5f5f5;
  }
  .nl-comida-row:last-child { border-bottom: none; }
  .nl-comida-icon {
    width: 32px; height: 32px; border-radius: 8px;
    background: #f9fafb; border: 1px solid #f0f0f0;
    display: flex; align-items: center; justify-content: center;
    font-size: 17px; flex-shrink: 0;
  }
  .nl-comida-info { flex: 1; min-width: 0; }
  .nl-comida-tiempo { font-size: 10.5px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; }
  .nl-comida-nombre { font-size: 12.5px; font-weight: 600; color: #1f2937; margin-top: 1px; }
  .nl-comida-desc { font-size: 11.5px; color: #9ca3af; margin-top: 2px; line-height: 1.45; }
  .nl-comida-override { font-size: 10px; color: #d97706; font-weight: 600; margin-top: 2px; }
  .nl-comida-kcal {
    font-size: 11.5px; font-weight: 700;
    padding: 3px 8px; border-radius: 20px;
    background: #f0fdf4; color: #16a34a;
    flex-shrink: 0; margin-top: 3px;
    border: 1px solid #dcfce7;
  }

  .nl-dieta-footer {
    padding: 8px 14px; background: #fafafa;
    border-top: 1px solid #f0f0f0;
    display: flex; align-items: center; gap: 6px;
    font-size: 11.5px; color: #9ca3af;
  }
  .nl-fenotipo-tag {
    padding: 1px 8px; border-radius: 20px;
    font-size: 10px; font-weight: 700;
    background: rgba(139,92,246,0.12); color: #8b5cf6;
    text-transform: uppercase; letter-spacing: 0.05em;
  }
  .nl-ajuste-pos { color: #16a34a; font-weight: 600; }
  .nl-ajuste-neg { color: #ef4444; font-weight: 600; }

  /* ═══════════════════════════════════════
     TARJETA SELECTOR DE SPLIT
  ═══════════════════════════════════════ */
  .nl-card-split {
    max-width: 88%;
    border-radius: 16px; border-top-left-radius: 4px;
    border: 1px solid #e5e7eb; overflow: hidden;
    background: #fff; animation: nlFadeUp 0.22s ease;
  }
  .nl-split-header {
    background: linear-gradient(135deg, #7c3aed, #16a34a);
    padding: 11px 14px;
  }
  .nl-split-header-title { font-size: 13.5px; font-weight: 700; color: #fff; }
  .nl-split-header-sub   { font-size: 11px; color: rgba(255,255,255,0.75); margin-top: 2px; }
  .nl-split-opt {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 14px; border-bottom: 1px solid #f5f5f5;
    cursor: pointer; transition: background 0.12s;
  }
  .nl-split-opt:last-child { border-bottom: none; }
  .nl-split-opt:hover { background: #f0fdf4; }
  .nl-split-num {
    width: 26px; height: 26px; border-radius: 8px;
    background: #f9fafb; border: 1px solid #e5e7eb;
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 700; color: #6b7280;
    flex-shrink: 0;
  }
  .nl-split-info { flex: 1; min-width: 0; }
  .nl-split-nombre { font-size: 12.5px; font-weight: 600; color: #1f2937; }
  .nl-split-dias   { font-size: 11px; color: #9ca3af; margin-top: 1px; }
  .nl-split-tag {
    font-size: 10px; font-weight: 600;
    padding: 2px 7px; border-radius: 20px; flex-shrink: 0;
  }
  .nl-split-tag.pop  { background: #f0fdf4; color: #16a34a; border: 1px solid #dcfce7; }
  .nl-split-tag.clas { background: #fffbeb; color: #d97706; border: 1px solid #fde68a; }
  .nl-split-tag.sci  { background: #eff6ff; color: #3b82f6; border: 1px solid #bfdbfe; }

  /* TYPING */
  .nl-typing {
    display: flex; align-items: center; gap: 4px;
    padding: 10px 14px;
    background: #fff; border: 1px solid #e5e7eb;
    border-radius: 16px; border-top-left-radius: 4px;
    width: fit-content;
  }
  .nl-typing-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: #d1d5db; animation: nlBounce 1.2s infinite;
  }
  .nl-typing-dot:nth-child(2) { animation-delay: 0.18s; }
  .nl-typing-dot:nth-child(3) { animation-delay: 0.36s; }

  /* INPUT */
  .nl-input-area {
    padding: 11px 14px;
    background: #fff; border-top: 1px solid #f0f0f0;
    display: flex; gap: 8px; align-items: flex-end; flex-shrink: 0;
  }
  .nl-textarea {
    flex: 1; background: #f9fafb;
    border: 1px solid #e5e7eb; border-radius: 12px;
    padding: 10px 13px; font-size: 13.5px;
    color: #111; font-family: inherit;
    resize: none; outline: none;
    min-height: 42px; max-height: 110px;
    transition: border-color 0.15s;
    line-height: 1.5;
  }
  .nl-textarea:focus { border-color: #16a34a; }
  .nl-textarea::placeholder { color: #d1d5db; }
  .nl-send-btn {
    width: 40px; height: 40px; border-radius: 12px;
    background: #16a34a; border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; transition: opacity 0.15s, transform 0.1s;
    font-size: 16px;
  }
  .nl-send-btn:hover { opacity: 0.85; }
  .nl-send-btn:active { transform: scale(0.94); }
  .nl-send-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  @keyframes nlFadeUp {
    from { opacity: 0; transform: translateY(7px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes nlBounce {
    0%, 60%, 100% { transform: translateY(0); }
    30% { transform: translateY(-5px); }
  }
`;

// ─── Chips de acceso rápido ────────────────────────────────────────────────
const CHIPS = [
  { label: '🏋️ Mi rutina hoy',  msg: 'dame mi rutina de hoy' },
  { label: '🥗 Mi dieta',        msg: 'dame mi dieta de esta semana' },
  { label: '🔀 Elegir split',    msg: 'quiero elegir mi split de entrenamiento' },
  { label: '🔥 Calorías hoy',    msg: '¿cuántas calorías llevo hoy?' },
  { label: '👤 Mi perfil',       msg: 'quiero ver mis datos' },
  { label: '⚖️ Actualizar peso', msg: 'quiero actualizar mi peso' },
];

// ─── Mensaje de bienvenida ─────────────────────────────────────────────────
const WELCOME = {
  text: '¡Hola! 👋 Soy tu asistente NutriLife. Puedo darte tu rutina del día, tu plan de dieta semanal, ayudarte a elegir tu split de entrenamiento o responder cualquier duda. ¿En qué te ayudo?',
  sender: 'bot',
  tipo: 'text',
};

// ─── Componente: Tarjeta de Rutina ─────────────────────────────────────────
const TarjetaRutina = ({ data }) => {
  if (!data) return null;

  if (data.es_descanso) {
    return (
      <div className="nl-card-rutina">
        <div className="nl-rutina-header">
          <span className="nl-rutina-badge">{data.tipo_split}</span>
          <span className="nl-rutina-title">Día {data.dia_del_mes} — {data.dia_nombre}</span>
          <span className="nl-rutina-dia">Semana {data.semana}</span>
        </div>
        <div className="nl-descanso">
          <div className="nl-descanso-icon">😴</div>
          <div style={{ fontWeight: 600, color: '#374151', marginBottom: 4 }}>Día de Descanso</div>
          <div>Hoy toca recuperación. Descansa, hidrátate y duerme bien. 💧</div>
        </div>
      </div>
    );
  }

  return (
    <div className="nl-card-rutina">
      <div className="nl-rutina-header">
        <span className="nl-rutina-badge">{data.tipo_split}</span>
        <span className="nl-rutina-title">Día {data.dia_del_mes} — {data.dia_nombre}</span>
        <span className="nl-rutina-dia">Semana {data.semana}</span>
      </div>

      {(data.ejercicios || []).map((ej, i) => (
        <div className="nl-ejercicio-row" key={i}>
          <div className="nl-ej-num">{i + 1}</div>
          <div className="nl-ej-info">
            <div className="nl-ej-nombre">{ej.nombre}</div>
            <div className="nl-ej-musculo">{ej.musculo}</div>
          </div>
          <div className="nl-ej-pills">
            <span className="nl-pill grey">{ej.series} series</span>
            <span className="nl-pill">{ej.repeticiones} reps</span>
          </div>
        </div>
      ))}

      <div className="nl-rutina-footer">
        ⏱ Descanso de <strong style={{ color: '#d97706', margin: '0 2px' }}>60–90 seg</strong> entre series
      </div>
    </div>
  );
};

// ─── Componente: Tarjeta de Dieta ──────────────────────────────────────────
const TarjetaDieta = ({ data, onCambiarComida }) => {
  if (!data) return null;

  const { dieta = {}, calorias_objetivo, fenotipo, ajuste_fenotipo } = data;

  // Calcular macros aproximados (30% prot, 45% carb, 25% grasa del total)
  const kcalTotal = calorias_objetivo || 2000;
  const prot = Math.round((kcalTotal * 0.30) / 4);
  const carb = Math.round((kcalTotal * 0.45) / 4);
  const fat  = Math.round((kcalTotal * 0.25) / 9);

  const ICONOS = { Desayuno: '🌅', Comida: '☀️', Cena: '🌙', Snack: '🍎' };
  const momentos = ['Desayuno', 'Comida', 'Cena', 'Snack'].filter(m => dieta[m]);

  const ajusteStr = ajuste_fenotipo > 0
    ? `+${ajuste_fenotipo} kcal`
    : ajuste_fenotipo < 0
    ? `${ajuste_fenotipo} kcal`
    : '±0 kcal';

  return (
    <div className="nl-card-dieta">
      <div className="nl-dieta-header">
        <div className="nl-dieta-title">🥗 Plan nutricional</div>
        <div className="nl-dieta-kcal-wrap">
          <div className="nl-dieta-kcal">{kcalTotal.toLocaleString()}</div>
          <div className="nl-dieta-kcal-label">kcal · objetivo diario</div>
        </div>
      </div>

      <div className="nl-macros-row">
        <div className="nl-macro-cell">
          <div className="nl-macro-val prot">{prot}g</div>
          <div className="nl-macro-lbl">Proteína</div>
        </div>
        <div className="nl-macro-cell">
          <div className="nl-macro-val carb">{carb}g</div>
          <div className="nl-macro-lbl">Carbos</div>
        </div>
        <div className="nl-macro-cell">
          <div className="nl-macro-val fat">{fat}g</div>
          <div className="nl-macro-lbl">Grasas</div>
        </div>
      </div>

      {momentos.map((momento) => {
        const comida = dieta[momento];
        return (
          <div className="nl-comida-row" key={momento}>
            <div className="nl-comida-icon">{ICONOS[momento] || '🍽️'}</div>
            <div className="nl-comida-info">
              <div className="nl-comida-tiempo">{momento} · {comida.hora || ''}</div>
              <div className="nl-comida-nombre">{comida.nombre || momento}</div>
              <div className="nl-comida-desc">{comida.descripcion || ''}</div>
              {comida._override && (
                <div className="nl-comida-override">✏️ Cambiado para hoy</div>
              )}
              {onCambiarComida && (
                <button
                  onClick={() => onCambiarComida(momento)}
                  style={{
                    background: 'none', border: 'none', padding: 0,
                    fontSize: 11, color: '#9ca3af', cursor: 'pointer',
                    textDecoration: 'underline', marginTop: 2
                  }}
                >
                  cambiar este día
                </button>
              )}
            </div>
            <span className="nl-comida-kcal">{comida.kcal} kcal</span>
          </div>
        );
      })}

      <div className="nl-dieta-footer">
        <span>Fenotipo:</span>
        <span className="nl-fenotipo-tag">{fenotipo || 'mesomorfo'}</span>
        <span className={ajuste_fenotipo >= 0 ? 'nl-ajuste-pos' : 'nl-ajuste-neg'}>
          {ajusteStr}
        </span>
        <span style={{ marginLeft: 'auto', fontSize: 10 }}>Se repite toda la semana</span>
      </div>
    </div>
  );
};

// ─── Componente: Selector de Split ─────────────────────────────────────────
const SelectorSplit = ({ onElegir }) => {
  const splits = [
    { key: 'PPL',          nombre: 'Push / Pull / Legs',  dias: '6 días/semana · 2x por grupo', tag: 'pop', tagLabel: 'Popular' },
    { key: 'Arnold',       nombre: 'Arnold Split',         dias: '6 días/semana · Antagonistas', tag: 'clas', tagLabel: 'Clásico' },
    { key: 'Upper/Lower',  nombre: 'Upper / Lower',        dias: '4 días/semana · Alta frecuencia', tag: 'sci', tagLabel: 'Científico' },
    { key: 'Bro Split',    nombre: 'Bro Split',            dias: '5 días/semana · 1 músculo/día', tag: 'clas', tagLabel: 'Clásico' },
    { key: 'Full Body',    nombre: 'Full Body',            dias: '3 días/semana · Principiantes', tag: 'sci', tagLabel: 'Efectivo' },
  ];

  return (
    <div className="nl-card-split">
      <div className="nl-split-header">
        <div className="nl-split-header-title">🏋️ Elige tu división de entrenamiento</div>
        <div className="nl-split-header-sub">Tu rutina mensual (28 días) se generará según tu elección</div>
      </div>
      {splits.map((s, i) => (
        <div className="nl-split-opt" key={s.key} onClick={() => onElegir(s.key)}>
          <div className="nl-split-num">{i + 1}</div>
          <div className="nl-split-info">
            <div className="nl-split-nombre">{s.nombre}</div>
            <div className="nl-split-dias">{s.dias}</div>
          </div>
          <span className={`nl-split-tag ${s.tag}`}>{s.tagLabel}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Componente principal ──────────────────────────────────────────────────
const Asistente = () => {
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('nutrilife_messages_v2');
      return saved ? JSON.parse(saved) : [WELCOME];
    } catch { return [WELCOME]; }
  });

  const [historial, setHistorial] = useState(() => {
    try {
      const saved = localStorage.getItem('nutrilife_historial_v2');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);

  const bottomRef   = useRef(null);
  const inputRef    = useRef(null);
  const stylesAdded = useRef(false);

  // Inyectar estilos una sola vez
  useEffect(() => {
    if (stylesAdded.current) return;
    const tag = document.createElement('style');
    tag.textContent = STYLES;
    document.head.appendChild(tag);
    stylesAdded.current = true;
  }, []);

  // Persistir en localStorage
  useEffect(() => {
    try { localStorage.setItem('nutrilife_messages_v2', JSON.stringify(messages)); } catch {}
  }, [messages]);

  useEffect(() => {
    try { localStorage.setItem('nutrilife_historial_v2', JSON.stringify(historial)); } catch {}
  }, [historial]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Foco inicial
  useEffect(() => { inputRef.current?.focus(); }, []);

  // ── Enviar mensaje ──────────────────────────────────────────────────────
  const sendMessage = async (texto) => {
    const msg = (texto || input).trim();
    if (!msg || loading) return;

    const userId = localStorage.getItem('userId');

    setMessages(prev => [...prev, { text: msg, sender: 'user', tipo: 'text' }]);
    setInput('');
    if (inputRef.current) { inputRef.current.style.height = 'auto'; }
    setLoading(true);
    inputRef.current?.focus();

    try {
      const res = await axios.post('http://localhost:3000/api/chatbot/message', {
        message: msg,
        userId,
        historial,
      });

      const { reply, tipo, data } = res.data;

      // Agregar mensaje del bot con tipo + datos estructurados si los hay
      setMessages(prev => [...prev, {
        text:   reply,
        sender: 'bot',
        tipo:   tipo || 'text',
        data:   data || null,
      }]);

      setHistorial(prev => [
        ...prev,
        { role: 'user',  parts: [{ text: msg }] },
        { role: 'model', parts: [{ text: reply }] },
      ]);
    } catch {
      setMessages(prev => [...prev, {
        text: 'No pude conectarme al servidor. Intenta de nuevo.',
        sender: 'bot', tipo: 'text',
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  // ── Cambiar comida: inyecta mensaje directo ─────────────────────────────
  const handleCambiarComida = (momento) => {
    sendMessage(`Quiero cambiar mi ${momento.toLowerCase()} de hoy`);
  };

  // ── Elegir split desde la tarjeta ──────────────────────────────────────
  const handleElegirSplit = (split) => {
    sendMessage(`Quiero el split: ${split}`);
  };

  // ── Limpiar conversación ────────────────────────────────────────────────
  const limpiarChat = () => {
    localStorage.removeItem('nutrilife_messages_v2');
    localStorage.removeItem('nutrilife_historial_v2');
    setMessages([{ ...WELCOME, text: '¡Conversación nueva! ¿En qué te ayudo hoy? 🍏' }]);
    setHistorial([]);
    inputRef.current?.focus();
  };

  // ── Auto-resize textarea ────────────────────────────────────────────────
  const handleInput = (e) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 110) + 'px';
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // ── Formatear texto markdown básico ────────────────────────────────────
  const formatText = (text) => {
    if (!text) return '';
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');
  };

  // ── Renderizar mensaje según tipo ───────────────────────────────────────
  const renderMessage = (msg, idx) => {
    if (msg.sender === 'user') {
      return (
        <div key={idx} className="nl-row nl-user">
          <div className="nl-bubble nl-user">{msg.text}</div>
          <div className="nl-msg-avatar" style={{ background: '#e5e7eb', color: '#6b7280', fontSize: 14 }}>👤</div>
        </div>
      );
    }

    const tipo = msg.tipo || 'text';

    // ── Tarjeta de rutina ──
    if (tipo === 'rutina' && msg.data) {
      return (
        <div key={idx} className="nl-row">
          <div className="nl-msg-avatar">🍏</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {msg.text && (
              <div className="nl-bubble nl-bot"
                dangerouslySetInnerHTML={{ __html: formatText(msg.text) }} />
            )}
            <TarjetaRutina data={msg.data} />
          </div>
        </div>
      );
    }

    // ── Tarjeta de dieta ──
    if (tipo === 'dieta' && msg.data) {
      return (
        <div key={idx} className="nl-row">
          <div className="nl-msg-avatar">🍏</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {msg.text && (
              <div className="nl-bubble nl-bot"
                dangerouslySetInnerHTML={{ __html: formatText(msg.text) }} />
            )}
            <TarjetaDieta data={msg.data} onCambiarComida={handleCambiarComida} />
          </div>
        </div>
      );
    }

    // ── Selector de split (cuando el bot pide al usuario elegir) ──
    if (tipo === 'pedir_split' || (msg.data?.pedir_split)) {
      return (
        <div key={idx} className="nl-row">
          <div className="nl-msg-avatar">🍏</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {msg.text && (
              <div className="nl-bubble nl-bot"
                dangerouslySetInnerHTML={{ __html: formatText(msg.text) }} />
            )}
            <SelectorSplit onElegir={handleElegirSplit} />
          </div>
        </div>
      );
    }

    // ── Confirmación de split generado ──
    if (tipo === 'split_confirmado' && msg.data) {
      const d = msg.data;
      return (
        <div key={idx} className="nl-row">
          <div className="nl-msg-avatar">🍏</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="nl-bubble nl-bot"
              dangerouslySetInnerHTML={{ __html: formatText(msg.text) }} />
            {d.preview_dia1?.ejercicios?.length > 0 && (
              <TarjetaRutina data={{
                tipo_split:  d.tipo_split,
                dia_del_mes: 1,
                semana:      1,
                dia_nombre:  d.preview_dia1.nombre,
                ejercicios:  d.preview_dia1.ejercicios,
                es_descanso: false,
              }} />
            )}
          </div>
        </div>
      );
    }

    // ── Burbuja de texto normal ──
    return (
      <div key={idx} className="nl-row">
        <div className="nl-msg-avatar">🍏</div>
        <div className="nl-bubble nl-bot"
          dangerouslySetInnerHTML={{ __html: formatText(msg.text) }} />
      </div>
    );
  };

  const hora = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="nl-chat-root">

      {/* ── HEADER ── */}
      <div className="nl-header">
        <div className="nl-header-left">
          <div className="nl-avatar">🍏</div>
          <div>
            <div className="nl-header-title">Asistente NutriLife</div>
            <div className="nl-header-sub">
              <span className="nl-dot" />
              Activo 
            </div>
          </div>
        </div>
        <button className="nl-clear-btn" onClick={limpiarChat} title="Nueva conversación">
          🗑️ Nueva sesión
        </button>
      </div>

      {/* ── QUICK CHIPS ── */}
      <div className="nl-chips">
        {CHIPS.map((chip) => (
          <button
            key={chip.label}
            className="nl-chip"
            onClick={() => sendMessage(chip.msg)}
            disabled={loading}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* ── MENSAJES ── */}
      <div className="nl-messages">
        <div className="nl-timestamp">Hoy, {hora}</div>

        {messages.map((msg, idx) => renderMessage(msg, idx))}

        {loading && (
          <div className="nl-row">
            <div className="nl-msg-avatar">🍏</div>
            <div className="nl-typing">
              <div className="nl-typing-dot" />
              <div className="nl-typing-dot" />
              <div className="nl-typing-dot" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── INPUT ── */}
      <div className="nl-input-area">
        <textarea
          ref={inputRef}
          className="nl-textarea"
          value={input}
          onChange={handleInput}
          onKeyDown={handleKey}
          placeholder="Escribe tu pregunta… (Enter para enviar)"
          rows={1}
          autoComplete="off"
        />
        <button
          className="nl-send-btn"
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
          aria-label="Enviar mensaje"
        >
          ➤
        </button>
      </div>

    </div>
  );
};

export default Asistente;
