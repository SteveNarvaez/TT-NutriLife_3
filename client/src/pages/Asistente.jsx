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
    background: #16a34a;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .nl-avatar svg { width: 18px; height: 18px; stroke: #fff; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
  .nl-header-title { font-size: 14.5px; font-weight: 600; color: #111; }
  .nl-header-sub { font-size: 11.5px; color: #9ca3af; margin-top: 1px; display: flex; align-items: center; gap: 5px; }
  .nl-dot { width: 6px; height: 6px; border-radius: 50%; background: #22c55e; display: inline-block; }
  .nl-clear-btn {
    padding: 6px 12px; border-radius: 8px; border: 1px solid #e5e7eb;
    background: none; cursor: pointer; font-size: 12px; color: #6b7280;
    display: flex; align-items: center; gap: 5px;
    transition: background 0.15s, color 0.15s;
  }
  .nl-clear-btn:hover { background: #f9fafb; color: #374151; }
  .nl-clear-btn svg { width: 13px; height: 13px; stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; }

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
    white-space: nowrap; padding: 5px 11px; border-radius: 20px;
    border: 1px solid #e5e7eb; background: #f9fafb;
    font-size: 12px; color: #6b7280; cursor: pointer;
    display: flex; align-items: center; gap: 5px;
    transition: all 0.15s; flex-shrink: 0;
  }
  .nl-chip:hover { border-color: #16a34a; color: #16a34a; background: #f0fdf4; }
  .nl-chip svg { width: 13px; height: 13px; stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }

  /* MESSAGES */
  .nl-messages {
    flex: 1; overflow-y: auto;
    padding: 16px; display: flex;
    flex-direction: column; gap: 10px;
    scroll-behavior: smooth;
    background: #fafafa;
  }
  .nl-messages::-webkit-scrollbar { width: 4px; }
  .nl-messages::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }

  .nl-timestamp {
    text-align: center; font-size: 11px; color: #d1d5db;
    margin: 4px 0;
  }

  .nl-row { display: flex; gap: 8px; align-items: flex-end; }
  .nl-row.nl-user { flex-direction: row-reverse; }

  .nl-msg-avatar {
    width: 26px; height: 26px; border-radius: 50%;
    background: #16a34a;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .nl-msg-avatar svg { width: 12px; height: 12px; stroke: #fff; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }

  .nl-bubble {
    max-width: 78%; padding: 10px 14px;
    border-radius: 16px; font-size: 13.5px; line-height: 1.6;
    animation: nlFadeUp 0.22s ease;
  }
  .nl-bubble.nl-bot {
    background: #fff; border: 1px solid #e5e7eb;
    color: #1f2937; border-bottom-left-radius: 4px;
  }
  .nl-bubble.nl-user {
    background: #16a34a; color: #fff;
    border-bottom-right-radius: 4px;
  }

  /* TARJETA DE DIETA / RUTINA */
  .nl-card {
    max-width: 84%; border-radius: 16px; border-bottom-left-radius: 4px;
    border: 1px solid #e5e7eb; overflow: hidden;
    background: #fff; animation: nlFadeUp 0.22s ease;
  }
  .nl-card-header {
    background: #16a34a; padding: 10px 14px;
    color: #fff; font-size: 13px; font-weight: 600;
    display: flex; align-items: center; gap: 7px;
  }
  .nl-card-header svg { width: 15px; height: 15px; stroke: #fff; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
  .nl-card-body { padding: 12px 14px; }

  .nl-macros { display: flex; gap: 8px; margin-bottom: 10px; }
  .nl-macro {
    flex: 1; text-align: center; background: #f9fafb;
    border: 1px solid #f0f0f0; border-radius: 10px; padding: 7px 4px;
  }
  .nl-macro-val { font-size: 15px; font-weight: 600; color: #111; }
  .nl-macro-lbl { font-size: 10.5px; color: #9ca3af; margin-top: 1px; }

  .nl-meal {
    display: flex; align-items: flex-start; justify-content: space-between;
    padding: 7px 0; border-top: 1px solid #f0f0f0; gap: 8px;
  }
  .nl-meal:first-child { border-top: none; }
  .nl-meal-left { display: flex; align-items: center; gap: 7px; }
  .nl-meal-icon { font-size: 14px; }
  .nl-meal-name { font-size: 12.5px; font-weight: 500; color: #374151; }
  .nl-meal-detail { font-size: 11.5px; color: #9ca3af; margin-top: 1px; }
  .nl-meal-kcal { font-size: 12px; color: #6b7280; flex-shrink: 0; padding-top: 2px; }

  .nl-exercise-item {
    display: flex; align-items: center; justify-content: space-between;
    padding: 7px 0; border-top: 1px solid #f0f0f0;
  }
  .nl-exercise-item:first-child { border-top: none; }
  .nl-exercise-name { font-size: 12.5px; font-weight: 500; color: #374151; }
  .nl-exercise-sub { font-size: 11.5px; color: #9ca3af; margin-top: 1px; }
  .nl-exercise-badge {
    font-size: 11px; padding: 3px 8px; border-radius: 6px;
    background: #f0fdf4; color: #16a34a; font-weight: 500; flex-shrink: 0;
  }

  /* TYPING */
  .nl-typing {
    display: flex; align-items: center; gap: 4px;
    padding: 10px 14px;
    background: #fff; border: 1px solid #e5e7eb;
    border-radius: 16px; border-bottom-left-radius: 4px;
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
  }
  .nl-send-btn:hover { opacity: 0.85; }
  .nl-send-btn:active { transform: scale(0.94); }
  .nl-send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .nl-send-btn svg { width: 17px; height: 17px; stroke: #fff; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }

  @keyframes nlFadeUp {
    from { opacity: 0; transform: translateY(7px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes nlBounce {
    0%, 60%, 100% { transform: translateY(0); }
    30% { transform: translateY(-5px); }
  }
`;

// ─── Íconos SVG inline ─────────────────────────────────────────────────────
const IconHeart  = () => <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>;
const IconSalad  = () => <svg viewBox="0 0 24 24"><path d="M12 2a9 9 0 0 1 9 9"/><path d="M12 2a9 9 0 0 0-9 9"/><path d="M3 11h18"/><path d="M12 2v9"/><path d="M4.22 15a9 9 0 0 0 15.56 0"/></svg>;
const IconDumbbell = () => <svg viewBox="0 0 24 24"><path d="M6.5 6.5h11M6.5 17.5h11M3 9.5h3M18 9.5h3M3 14.5h3M18 14.5h3M3 9.5v5M21 9.5v5M6 6.5v11M18 6.5v11"/></svg>;
const IconUser   = () => <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IconFlame  = () => <svg viewBox="0 0 24 24"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>;
const IconScale  = () => <svg viewBox="0 0 24 24"><path d="M12 3v2M3 9h18M7 9l3 9M17 9l-3 9M5 21h14"/></svg>;
const IconTrash  = () => <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>;
const IconSend   = () => <svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;

// ─── Chips de acceso rápido ────────────────────────────────────────────────
const CHIPS = [
  { label: 'Mi dieta',         icon: <IconSalad />,    msg: 'dame mi dieta de hoy' },
  { label: 'Mi rutina',        icon: <IconDumbbell />, msg: 'quiero ver mi rutina de ejercicios' },
  { label: 'Mi perfil',        icon: <IconUser />,     msg: 'quiero ver mis datos' },
  { label: 'Calorías hoy',     icon: <IconFlame />,    msg: '¿cuántas calorías llevo hoy?' },
  { label: 'Actualizar peso',  icon: <IconScale />,    msg: 'quiero actualizar mi peso' },
];

// ─── Mensaje de bienvenida ─────────────────────────────────────────────────
const WELCOME = {
  text: '¡Hola! 👋 Soy tu asistente NutriLife. Puedo ayudarte con tu dieta, rutina de ejercicios y seguimiento de progreso. Usa los accesos rápidos de arriba o escríbeme directamente.',
  sender: 'bot',
  type: 'text',
};

// ─── Componente principal ──────────────────────────────────────────────────
const Asistente = () => {
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('nutrilife_messages');
      return saved ? JSON.parse(saved) : [WELCOME];
    } catch { return [WELCOME]; }
  });

  const [historial, setHistorial] = useState(() => {
    try {
      const saved = localStorage.getItem('nutrilife_historial');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);

  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);
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
    try { localStorage.setItem('nutrilife_messages', JSON.stringify(messages)); } catch {}
  }, [messages]);

  useEffect(() => {
    try { localStorage.setItem('nutrilife_historial', JSON.stringify(historial)); } catch {}
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

    setMessages(prev => [...prev, { text: msg, sender: 'user', type: 'text' }]);
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

      const reply = res.data?.reply || 'Sin respuesta del servidor.';

      // Detectar si la respuesta contiene datos estructurados de dieta o rutina
      const msgObj = parsearRespuesta(reply);
      setMessages(prev => [...prev, msgObj]);
      setHistorial(prev => [
        ...prev,
        { role: 'user',  parts: [{ text: msg }] },
        { role: 'model', parts: [{ text: reply }] },
      ]);
    } catch {
      setMessages(prev => [...prev, {
        text: 'No pude conectarme al servidor. Intenta de nuevo.',
        sender: 'bot', type: 'text',
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  // ── Parsear respuesta para detectar tarjetas ────────────────────────────
  const parsearRespuesta = (reply) => {
    const lower = reply.toLowerCase();

    // Detectar respuesta de dieta (tiene macros y comidas)
    const esDieta = (lower.includes('desayuno') || lower.includes('comida') || lower.includes('cena'))
      && (lower.includes('kcal') || lower.includes('calorías') || lower.includes('proteína'));

    // Detectar respuesta de ejercicios
    const esRutina = (lower.includes('series') || lower.includes('repeticiones'))
      && (lower.includes('grupo muscular') || lower.includes('ejercicio') || lower.includes('rutina'));

    if (esDieta || esRutina) {
      return { text: reply, sender: 'bot', type: esDieta ? 'diet' : 'exercise' };
    }

    return { text: reply, sender: 'bot', type: 'text' };
  };

  // ── Limpiar conversación ────────────────────────────────────────────────
  const limpiarChat = () => {
    localStorage.removeItem('nutrilife_messages');
    localStorage.removeItem('nutrilife_historial');
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
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');
  };

  // ── Renderizar burbuja según tipo ───────────────────────────────────────
  const renderMessage = (msg, idx) => {
    if (msg.sender === 'user') {
      return (
        <div key={idx} className="nl-row nl-user">
          <div className="nl-bubble nl-user">{msg.text}</div>
        </div>
      );
    }

    // Tarjeta de dieta o ejercicios — header verde + contenido estructurado
    if (msg.type === 'diet' || msg.type === 'exercise') {
      const esDieta = msg.type === 'diet';
      return (
        <div key={idx} className="nl-row">
          <div className="nl-msg-avatar"><IconHeart /></div>
          <div className="nl-card">
            <div className="nl-card-header">
              {esDieta ? <IconSalad /> : <IconDumbbell />}
              {esDieta ? 'Plan de alimentación del día' : 'Rutina de ejercicios'}
            </div>
            <div className="nl-card-body">
              <p style={{ fontSize: 13, lineHeight: 1.65, color: '#374151', whiteSpace: 'pre-wrap' }}
                dangerouslySetInnerHTML={{ __html: formatText(msg.text) }} />
            </div>
          </div>
        </div>
      );
    }

    // Burbuja de texto normal
    return (
      <div key={idx} className="nl-row">
        <div className="nl-msg-avatar"><IconHeart /></div>
        <div className="nl-bubble nl-bot"
          dangerouslySetInnerHTML={{ __html: formatText(msg.text) }} />
      </div>
    );
  };

  // ── Hora actual ─────────────────────────────────────────────────────────
  const hora = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="nl-chat-root">

      {/* ── HEADER ── */}
      <div className="nl-header">
        <div className="nl-header-left">
          <div className="nl-avatar"><IconHeart /></div>
          <div>
            <div className="nl-header-title">Asistente NutriLife</div>
            <div className="nl-header-sub">
              <span className="nl-dot" />
              Activo 
            </div>
          </div>
        </div>
        <button className="nl-clear-btn" onClick={limpiarChat} title="Nueva conversación">
          <IconTrash />
          Nueva sesión
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
            {chip.icon}
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
            <div className="nl-msg-avatar"><IconHeart /></div>
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
          <IconSend />
        </button>
      </div>

    </div>
  );
};

export default Asistente;