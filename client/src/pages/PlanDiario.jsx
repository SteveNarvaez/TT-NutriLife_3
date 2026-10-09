import React, { useState, useEffect } from 'react';

const PlanDiario = ({ userId }) => {
  const [tareas, setTareas] = useState([
    { id: 1, tipo: 'agua', titulo: 'Calculando tu requerimiento...', completado: false, icono: '💧' },
    { id: 2, tipo: 'dieta', titulo: 'Desayuno Proteico', completado: false, icono: '🍳' },
    { id: 3, tipo: 'dieta', titulo: 'Comida Equilibrada', completado: false, icono: '🥗' },
    { id: 4, tipo: 'dieta', titulo: 'Cena Ligera', completado: false, icono: '🌙' },
    { id: 5, tipo: 'ejercicio', titulo: 'Rutina del Día', completado: false, icono: '🏋️' },
  ]);

  const [guardado, setGuardado] = useState(false);

  // AL CARGAR LA PÁGINA: Buscar el peso y calcular el agua
  useEffect(() => {
    const obtenerPesoYCalcularAgua = async () => {
      try {
        const id = userId || "1";
        const response = await fetch(`http://localhost:3000/api/usuario/peso/${id}`);
        const data = await response.json();
        
        const litrosRecomendados = (data.peso * 0.035).toFixed(1);

        setTareas(tareasAnteriores => 
          tareasAnteriores.map(t => 
            t.tipo === 'agua' ? { ...t, titulo: `Tomar ${litrosRecomendados} Litros de Agua` } : t
          )
        );
      } catch (error) {
        console.error("Error al obtener el peso para el agua:", error);
      }
    };

    obtenerPesoYCalcularAgua();
  }, [userId]);

  const tareasCompletadas = tareas.filter(t => t.completado).length;
  const progreso = Math.round((tareasCompletadas / tareas.length) * 100);

const toggleTarea = async (id) => {
  const tarea = tareas.find(t => t.id === id);
  const nuevoEstado = !tarea.completado;

  const nuevasTareas = tareas.map(t =>
    t.id === id ? { ...t, completado: nuevoEstado } : t
  );
  setTareas(nuevasTareas);
  setGuardado(false);

  // ✅ Si es una comida y se marcó como completada → registrar en BD
  if (tarea.tipo === 'dieta' && nuevoEstado) {
    const momentoMap = {
      'Desayuno Proteico': 'Desayuno',
      'Comida Equilibrada': 'Comida',
      'Cena Ligera':        'Cena',
    };
    const momento = momentoMap[tarea.titulo];
    if (momento) {
      const id_usuario = userId || localStorage.getItem('userId') || '1';
      try {
        await fetch('http://localhost:3000/api/plandiario/registrar-comida', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id_usuario, momento_dia: momento })
        });
      } catch (err) {
        console.error('Error registrando comida:', err);
      }
    }
  }
};

  // FUNCIÓN PARA GUARDAR EN LA BASE DE DATOS
const handleGuardarProgreso = async () => {
  try {
    const id = userId || localStorage.getItem('userId') || "1";

    // 1. Guardar porcentaje de constancia (ya lo tenías)
    await fetch('http://localhost:3000/api/constancia/guardar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_usuario: id, porcentaje: progreso })
    });

    // 2. ← NUEVO: Si completó la rutina, registrar entrenamiento
    const hizoEjercicio = tareas.find(t => t.tipo === 'ejercicio')?.completado;
    if (hizoEjercicio) {
      await fetch('http://localhost:3000/api/rutina/registrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_usuario: id })
      });
    }

    setGuardado(true);
  } catch (error) {
    console.error("Error de red al guardar el progreso:", error);
  }
};

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-3xl font-extrabold text-green-800 mb-2">Tu Plan Diario</h2>
      <p className="text-gray-500 mb-8">Marca tus objetivos conforme avance tu día para mantener tu racha.</p>

      {/* BARRA DE PROGRESO */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="font-semibold text-gray-700">Progreso de hoy</span>
          <span className="font-bold text-green-600">{progreso}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div 
            className="bg-green-500 h-4 rounded-full transition-all duration-500 ease-out" 
            style={{ width: `${progreso}%` }}
          ></div>
        </div>
        {progreso === 100 && (
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
            className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all border-2 ${
              tarea.completado 
                ? 'bg-green-50 border-green-200 opacity-75' 
                : 'bg-white border-transparent hover:border-green-100 shadow-sm'
            }`}
          >
            <div className="flex items-center gap-4">
              <span className="text-2xl">{tarea.icono}</span>
              <span className={`font-medium text-lg ${tarea.completado ? 'line-through text-gray-400' : 'text-gray-700'}`}>
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

      {/* BOTÓN DE GUARDAR */}
      <div className="flex flex-col items-center">
        <button 
          onClick={handleGuardarProgreso}
          className="w-full md:w-auto px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
        >
          {guardado ? '¡Registro Guardado! ✅' : 'Guardar mi progreso del día 🚀'}
        </button>
        
        {guardado && (
          <p className="text-green-600 mt-4 font-medium animate-in fade-in">
            ¡Excelente trabajo! Tu constancia de hoy ({progreso}%) ha sido registrada.
          </p>
        )}
      </div>
    </div>
  );
};

export default PlanDiario;