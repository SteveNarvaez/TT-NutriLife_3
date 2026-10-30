import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState(null);       // null | { tipo, mensaje, email }
  const [reenviando, setRenviando]      = useState(false);
  const [mensajeReenvio, setMensajeReenvio] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setMensajeReenvio('');
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/login`, { email, password });

      localStorage.setItem('userId',   response.data.userId);
      localStorage.setItem('userName', response.data.user.nombre);
      console.log('✅ Login exitoso. ID guardado:', response.data.userId);
      navigate('/dashboard');

    } catch (err) {
      const data = err.response?.data;
      if (data?.error === 'EMAIL_NO_VERIFICADO') {
        // Email no verificado — mostrar bloque especial con botón de reenvío
        setError({ tipo: 'no_verificado', mensaje: data.message, email: data.email });
      } else {
        setError({ tipo: 'generico', mensaje: data?.error || 'Error al iniciar sesión' });
      }
    }
  };

  const handleReenviar = async () => {
    setRenviando(true);
    setMensajeReenvio('');
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/reenviar-verificacion`, {
        email: error?.email || email,
      });
      setMensajeReenvio(res.data.message || 'Correo reenviado. Revisa tu bandeja.');
    } catch {
      setMensajeReenvio('Error al reenviar. Intenta de nuevo.');
    } finally {
      setRenviando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-800">Hola de nuevo 🍏</h2>
          <p className="text-gray-500 mt-2">Ingresa a tu cuenta de NutriLife</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
            <input
              type="email"
              className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-green-400 outline-none transition"
              placeholder="tu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input
              type="password"
              className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-green-400 outline-none transition"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {/* ── Mensajes de error ── */}
          {error?.tipo === 'no_verificado' && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-4">
              <p className="text-amber-700 font-bold text-sm mb-1">📬 Verifica tu correo</p>
              <p className="text-amber-600 text-xs mb-3">{error.mensaje}</p>
              {mensajeReenvio ? (
                <p className="text-green-600 text-xs font-medium">{mensajeReenvio}</p>
              ) : (
                <button
                  type="button"
                  onClick={handleReenviar}
                  disabled={reenviando}
                  className="text-xs text-amber-700 underline hover:text-amber-900 disabled:opacity-50"
                >
                  {reenviando ? 'Enviando...' : '🔁 Reenviar correo de verificación'}
                </button>
              )}
            </div>
          )}

          {error?.tipo === 'generico' && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-red-600 text-sm">{error.mensaje}</p>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-green-500 text-white py-3 rounded-lg font-bold hover:bg-green-600 transition-colors shadow-lg shadow-green-200"
          >
            Entrar ahora
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-600">
          ¿No tienes cuenta?{' '}
          <Link to="/" className="text-green-600 font-bold hover:underline">Regístrate gratis</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;