import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await axios.post('http://localhost:3000/api/auth/login', { email, password });

      // Guardar datos de sesión
      localStorage.setItem('userId',   data.userId);
      localStorage.setItem('userName', data.user.nombre);
      localStorage.setItem('userRol',  data.user.rol || 'usuario');

      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 shadow-lg shadow-emerald-500/30 mb-4">
            <span className="text-3xl">🌿</span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-800 dark:text-white">NutriLife</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Hola de nuevo 👋 Accede a tu cuenta</p>
        </div>

        {/* Card */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/30 dark:border-gray-700/50 p-8">
          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 text-sm text-red-700 dark:text-red-400">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600
                  bg-white dark:bg-gray-900 text-gray-800 dark:text-white
                  placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50
                  transition-shadow duration-150"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 dark:border-gray-600
                    bg-white dark:bg-gray-900 text-gray-800 dark:text-white
                    placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50
                    transition-shadow duration-150"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  {showPw ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-white
                bg-gradient-to-r from-emerald-500 to-teal-600
                hover:from-emerald-600 hover:to-teal-700
                shadow-lg shadow-emerald-500/30
                disabled:opacity-60 disabled:cursor-not-allowed
                transition-all duration-150"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Entrando…
                </span>
              ) : 'Entrar ahora →'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            ¿No tienes cuenta?{' '}
            <Link to="/" className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
              Regístrate gratis
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
