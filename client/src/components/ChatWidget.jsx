import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "¡Hola! Soy tu asistente de NutriLife. ¿En qué puedo ayudarte hoy?", sender: 'bot' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false); // Estado para el indicador de carga
  
  const scrollRef = useRef(null);

  // Auto-scroll al recibir o enviar mensajes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const sendMessage = async () => {
    const messageText = input.trim();
    if (!messageText) return;

    // 1. Obtener el ID del usuario dinámicamente desde el almacenamiento local
    // Asegúrate de guardar 'userId' en localStorage cuando el usuario haga login
    const userId = localStorage.getItem('userId') || 'anonimo'; 

    const userMessage = { text: messageText, sender: 'user' };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true); // Activamos el indicador de "bot escribiendo"

    try {
      // 2. Enviamos tanto el mensaje como el userId al backend
      const storedId = localStorage.getItem('userId');
const response = await axios.post('http://localhost:3000/api/chatbot/message', { 
  message: input,
  userId: storedId // <--- Lo enviamos al servidor
});

      const botReply = { 
        text: response.data.reply, 
        sender: 'bot' 
      };
      
      setMessages((prev) => [...prev, botReply]);

    } catch (error) {
      console.error("Error al conectar con el servidor:", error);
      setMessages((prev) => [...prev, { 
        text: "Error de conexión. Verifica que el servidor esté encendido.", 
        sender: 'bot' 
      }]);
    } finally {
      setIsTyping(false); // Apagamos el indicador de carga
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Botón Flotante */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-green-600 text-white p-4 rounded-full shadow-lg hover:bg-green-700 transition-all flex items-center justify-center w-14 h-14 hover:scale-110 active:scale-95"
      >
        {isOpen ? <span className="text-xl">✕</span> : <span className="text-2xl">💬</span>}
      </button>

      {/* Ventana de Chat */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-85 h-[450px] bg-white border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
          
          {/* Header con estilo dinámico */}
          <div className="bg-green-600 text-white p-4 font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-300 rounded-full animate-pulse"></div>
              <span>Asistente NutriLife</span>
            </div>
          </div>
          
          {/* Cuerpo del Chat */}
          <div className="flex-1 p-4 overflow-y-auto flex flex-col space-y-3 bg-gray-50">
            {messages.map((msg, i) => (
              <div 
                key={i} 
                className={`p-3 rounded-2xl max-w-[85%] text-sm leading-relaxed shadow-sm ${
                  msg.sender === 'user' 
                    ? 'bg-green-600 text-white self-end rounded-br-none' 
                    : 'bg-white text-gray-800 self-start rounded-bl-none border border-gray-100'
                }`}
              >
                {msg.text}
              </div>
            ))}

            {/* Indicador de escribiendo */}
            {isTyping && (
              <div className="bg-white text-gray-400 self-start p-3 rounded-2xl rounded-bl-none border border-gray-100 flex gap-1 shadow-sm">
                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
            )}
            <div ref={scrollRef} />
          </div>

          {/* Área de Input */}
          <div className="p-3 border-t bg-white flex items-center gap-2">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all"
              placeholder="Pregunta sobre tu dieta..."
            />
            <button 
              onClick={sendMessage} 
              disabled={isTyping}
              className={`p-2 rounded-xl transition-all shadow-md ${
                isTyping ? 'bg-gray-300' : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;