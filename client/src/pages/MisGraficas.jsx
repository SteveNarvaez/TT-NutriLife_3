import React, { useState, useEffect } from 'react';
// Añadimos BarChart y Bar a las importaciones
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const MisGraficas = ({ userId }) => {
    const [datosPeso, setDatosPeso] = useState([]);
    const [datosConstancia, setDatosConstancia] = useState([]); // Nuevo estado para la segunda gráfica

    useEffect(() => {
        const obtenerDatos = async () => {
            try {
                const id = userId || "1"; 

                // 1. Traemos los datos de la gráfica de Peso
                const resPeso = await fetch(`http://localhost:3000/api/graficas/peso/${id}`);
                const dataPeso = await resPeso.json();
                setDatosPeso(dataPeso);

                // 2. Traemos los datos de la gráfica de Constancia (NUEVO)
                const resConstancia = await fetch(`http://localhost:3000/api/graficas/constancia/${id}`);
                const dataConstancia = await resConstancia.json();
                setDatosConstancia(dataConstancia);

            } catch (error) {
                console.error("Error cargando las gráficas:", error);
            }
        };

        obtenerDatos();
    }, [userId]);

    return (
        <div className="space-y-8 pb-10">
            
            {/* 🟢 GRÁFICA 1: PROGRESO DE PESO */}
            <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-2xl font-bold text-green-800 mb-4">Mi Progreso de Peso</h2>
                
                {datosPeso.length > 0 ? (
                    <div style={{ width: '100%', height: 300, minWidth: 0 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={datosPeso} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="fecha" tick={{fill: '#6b7280'}} tickMargin={10} />
                                <YAxis domain={['auto', 'auto']} tick={{fill: '#6b7280'}} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="peso" 
                                    name="Peso (kg)"
                                    stroke="#16a34a" 
                                    strokeWidth={4}
                                    activeDot={{ r: 8, fill: '#15803d', stroke: 'white', strokeWidth: 2 }} 
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="h-40 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-xl">
                        <p className="text-gray-400 text-center">Aún no hay suficientes datos de peso registrados.</p>
                    </div>
                )}
            </div>

            {/* 📊 GRÁFICA 2: CONSTANCIA DIARIA */}
            <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-2xl font-bold text-blue-800 mb-1">Mi Disciplina Semanal</h2>
                <p className="text-gray-500 mb-6 text-sm">Porcentaje de tareas diarias completadas</p>
                
                {datosConstancia.length > 0 ? (
                    <div style={{ width: '100%', height: 300, minWidth: 0 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={datosConstancia} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="fecha" tick={{fill: '#6b7280'}} tickMargin={10} />
                                <YAxis domain={[0, 100]} tick={{fill: '#6b7280'}} tickFormatter={(tick) => `${tick}%`} />
                                <Tooltip 
                                    cursor={{fill: '#f3f4f6'}}
                                    contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value) => [`${value}%`, 'Completado']}
                                />
                                <Bar 
                                    dataKey="porcentaje" 
                                    fill="#3b82f6" /* Color azul para diferenciar del peso */
                                    radius={[6, 6, 0, 0]} /* Bordes redondeados arriba */
                                    barSize={40}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="h-40 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-xl">
                        <p className="text-gray-400 text-center">Ve a "Plan Diario" y guarda tu progreso de hoy para ver tu gráfica.</p>
                    </div>
                )}
            </div>

        </div>
    );
};

export default MisGraficas;