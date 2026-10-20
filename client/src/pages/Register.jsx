import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Triaje from './Triaje';

const Register = () => {
  const [formData, setFormData] = useState({
    nombre: '', email: '', password: '',
    fecha_nacimiento: '', sexo: 'Masculino',
    acepto_disclaimer: false,
  });
  const [triajeCompletado, setTriajeCompletado] = useState(false);
  const [mostrarTriaje, setMostrarTriaje] = useState(false);
  const navigate = useNavigate();

  const handleTriajeCompletado = (payload) => {
    sessionStorage.setItem('triaje_data', JSON.stringify(payload));
    setTriajeCompletado(true);
    setMostrarTriaje(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!triajeCompletado) {
      alert('Debes completar el triaje médico antes de crear tu cuenta.');
      return;
    }
    try {
      const res = await axios.post('http://localhost:3000/api/auth/register', formData);
      const { userId } = res.data;

      const triajeData = JSON.parse(sessionStorage.getItem('triaje_data') || '{}');
      if (userId && Object.keys(triajeData).length > 0) {
        await axios.post('http://localhost:3000/api/triaje/guardar', {
          ...triajeData,
          id_usuario: userId,
        });
      }

      sessionStorage.removeItem('triaje_data');
      alert('¡Cuenta creada exitosamente!');
      navigate('/login');
    } catch (err) {
      const mensaje = err.response?.data?.error || 'Error de conexión';
      if (mensaje.includes('usuarios_email_key')) {
        alert('Este correo ya está registrado. ¡Mejor inicia sesión! 😉');
      } else {
        alert(mensaje);
      }
    }
  };

  // Modal de triaje
  if (mostrarTriaje) {
    return (
      <div className="min-h-screen bg-black/60 flex items-center justify-center p-4 relative">
        <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">
          <Triaje
            modoModal
            onCompletado={handleTriajeCompletado}
            onCerrar={() => setMostrarTriaje(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg border border-gray-100">

        <h2 className="text-3xl font-extrabold text-green-600 mb-2 text-center">Únete a NutriLife 🍏</h2>
        <p className="text-center text-gray-400 text-sm mb-6">Crea tu cuenta y empieza tu cambio hoy</p>

        <div className="space-y-4">
          <input
            type="text" placeholder="Nombre completo"
            className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-400 transition"
            onChange={e => setFormData({ ...formData, nombre: e.target.value })} required
          />
          <input
            type="email" placeholder="Correo electrónico"
            className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-400 transition"
            onChange={e => setFormData({ ...formData, email: e.target.value })} required
          />
          <input
            type="password" placeholder="Contraseña"
            className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-400 transition"
            onChange={e => setFormData({ ...formData, password: e.target.value })} required
          />
          <div className="flex gap-3">
            <div className="w-1/2">
              <label className="text-xs text-gray-400 mb-1 block pl-1">Fecha de nacimiento</label>
              <input
                type="date"
                className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-400 transition"
                onChange={e => setFormData({ ...formData, fecha_nacimiento: e.target.value })} required
              />
            </div>
            <div className="w-1/2">
              <label className="text-xs text-gray-400 mb-1 block pl-1">Sexo</label>
              <select
                className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-400 transition"
                onChange={e => setFormData({ ...formData, sexo: e.target.value })}
              >
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── TRIAJE ── */}
        <div className={`mt-6 p-4 rounded-xl border-2 transition-all ${
          triajeCompletado ? 'bg-green-50 border-green-300' : 'bg-amber-50 border-amber-200'
        }`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className={`font-bold text-sm ${triajeCompletado ? 'text-green-700' : 'text-amber-700'}`}>
                {triajeCompletado ? '✅ Triaje médico completado' : '⚕️ Triaje médico requerido'}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {triajeCompletado
                  ? 'Tu perfil de salud fue registrado correctamente.'
                  : 'Debes completar el cuestionario de salud antes de crear tu cuenta.'}
              </p>
            </div>
            {!triajeCompletado && (
              <button
                type="button"
                onClick={() => setMostrarTriaje(true)}
                className="flex-shrink-0 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-4 py-2 rounded-lg transition shadow-sm"
              >
                Iniciar →
              </button>
            )}
          </div>
        </div>

        {/* ── DISCLAIMER ── */}
        <label className="flex items-start gap-2 mt-4 cursor-pointer">
          <input
            type="checkbox" className="w-4 h-4 mt-0.5 flex-shrink-0"
            onChange={e => setFormData({ ...formData, acepto_disclaimer: e.target.checked })} required
          />
          <span className="text-xs text-gray-500">
            Acepto los <span className="text-green-600 font-medium">términos y condiciones médicos</span> de NutriLife.
            Entiendo que esta app no reemplaza consulta médica profesional.
          </span>
        </label>

        <button
          type="submit"
          disabled={!formData.acepto_disclaimer || !triajeCompletado}
          className="w-full mt-5 bg-green-500 text-white p-3 rounded-xl font-bold hover:bg-green-600 transition shadow-lg disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
        >
          Crear mi cuenta
        </button>

        <p className="mt-4 text-center text-gray-500 text-sm">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-green-600 font-bold hover:underline">Inicia sesión aquí</Link>
        </p>
      </form>
    </div>
  );
};

export default Register;