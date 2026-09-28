import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Asistente from './Asistente'; 
import MisGraficas from './MisGraficas';
import PlanDiario from './PlanDiario';

const Dashboard = () => {
  const [name, setName] = useState('');
  const [view, setView] = useState('inicio');
  const [userId, setUserId] = useState(null); 
  const navigate = useNavigate();

  useEffect(() => {
    const storedName = localStorage.getItem('userName');
    const storedId = localStorage.getItem('userId');
    if (!storedName) {
      navigate('/login');
    } else {
      setName(storedName);
      setUserId(storedId);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="h-screen w-screen bg-gray-50 flex overflow-hidden">
      
      {/* Sidebar - Lado Izquierdo */}
      <aside className="w-64 bg-green-700 text-white hidden md:flex flex-col p-6 shadow-xl h-full flex-shrink-0">
        <h2 className="text-2xl font-bold mb-10">NutriLife 🍏</h2>
        
        <nav className="space-y-4 flex-1">
          <button 
            onClick={() => setView('inicio')}
            className={`flex items-center gap-3 w-full text-left font-medium p-2 rounded-lg transition ${
              view === 'inicio' ? 'bg-green-800 shadow-inner' : 'hover:bg-green-600'
            }`}
          >
            🏠 Inicio
          </button>

          <button 
            onClick={() => setView('chat')}
            className={`flex items-center gap-3 w-full text-left font-medium p-2 rounded-lg transition ${
              view === 'chat' ? 'bg-green-800 shadow-inner' : 'hover:bg-green-600'
            }`}
          >
            💬 Asistente IA
          </button>

          <button 
            onClick={() => setView('graficas')}
            className={`flex items-center gap-3 w-full text-left font-medium p-2 rounded-lg transition ${
              view === 'graficas' ? 'bg-green-800 shadow-inner' : 'hover:bg-green-600'
            }`}
          >
            📊 Mis Gráficas
          </button>
          
         <button 
            onClick={() => setView('plan')}
            className={`flex items-center gap-3 w-full text-left font-medium p-2 rounded-lg transition ${
              view === 'plan' ? 'bg-green-800 shadow-inner' : 'hover:bg-green-600'
            }`}
          >
            📅 Plan Diario
          </button>
        </nav>

        <button 
          onClick={handleLogout} 
          className="text-left text-sm text-green-300 hover:text-white mt-auto pt-4 border-t border-green-600 transition-colors"
        >
          Cerrar Sesión 🚪
        </button>
      </aside>

      {/* Contenido Principal - Lado Derecho */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50">
        
        {/* 1️⃣ VISTA DE INICIO */}
        {view === 'inicio' && (
          <div className="flex-1 overflow-y-auto p-8 animate-in fade-in duration-500">
            <header className="flex justify-between items-center mb-10">
              <div>
                <h1 className="text-3xl font-extrabold text-gray-800">¡Hola, {name}! 👋</h1>
                <p className="text-gray-500">Hoy es un gran día para cuidar tu salud.</p>
              </div>
              <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center text-green-700 font-bold uppercase shadow-sm">
                {name ? name.charAt(0) : 'U'}
              </div>
            </header>

            {/* Tarjetas de Resumen */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
                <h3 className="text-gray-400 text-sm font-medium uppercase">Estado del Triaje</h3>
                <p className="text-2xl font-bold text-green-600">✅ Completado</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
                <h3 className="text-gray-400 text-sm font-medium uppercase">Calorías Objetivo</h3>
                <p className="text-2xl font-bold text-blue-600">2,244 kcal</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
                <h3 className="text-gray-400 text-sm font-medium uppercase">Nivel de Actividad</h3>
                <p className="text-2xl font-bold text-orange-600">Intermedio</p>
              </div>
            </div>
          </div>
        )}

        {/* 2️⃣ VISTA DEL CHAT */}
        {view === 'chat' && (
          <div className="flex-1 h-full p-4 md:p-8 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
            <Asistente />
          </div>
        )}

       {/* 3️⃣ VISTA DE GRÁFICAS */}
        {view === 'graficas' && (
          <div className="flex-1 overflow-y-auto p-8 animate-in fade-in duration-500">
             {/* 🟢 AHORA ES DINÁMICO */}
            <MisGraficas userId={userId} /> 
          </div>
        )}

        {/* 4️⃣ VISTA DE PLAN DIARIO */}
        {view === 'plan' && (
          <div className="flex-1 overflow-y-auto p-4 md:p-8 animate-in fade-in duration-500">
             {/* 🟢 AHORA ES DINÁMICO */}
            <PlanDiario userId={userId} />
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;