import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Mail, Lock, Eye, EyeOff, ArrowRight, MailCheck, CircleAlert, CircleCheck, RefreshCw } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';

const Login = () => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [verPass, setVerPass]   = useState(false);
  const [error, setError]       = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [reenviando, setRenviando]          = useState(false);
  const [mensajeReenvio, setMensajeReenvio] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const mensajeExito = location.state?.mensaje;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setMensajeReenvio('');
    setEnviando(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/login`, { email, password });

      localStorage.setItem('userId',   response.data.userId);
      localStorage.setItem('token',    response.data.token);
      localStorage.setItem('userName', response.data.user.nombre);
      localStorage.setItem('userRol',  response.data.user.rol || 'usuario');
      navigate('/dashboard');
    } catch (err) {
      const data = err.response?.data;
      if (data?.error === 'EMAIL_NO_VERIFICADO') {
        setError({ tipo: 'no_verificado', mensaje: data.message, email: data.email });
      } else {
        setError({ tipo: 'generico', mensaje: data?.error || 'No pudimos conectar con el servidor. Intenta de nuevo.' });
      }
    } finally {
      setEnviando(false);
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
    <AuthLayout>
      <div className="card p-7 sm:p-9">
        <div className="mb-7">
          <p className="eyebrow">Bienvenido de vuelta</p>
          <h2 className="mt-2 text-[26px] font-bold tracking-tight text-ink-900 dark:text-white">Inicia sesión</h2>
          <p className="muted mt-1">Continúa con tu plan de alimentación y entrenamiento.</p>
        </div>

        {mensajeExito && (
          <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-brand-200 bg-brand-50 p-3 text-sm text-brand-800 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-200">
            <CircleCheck size={18} className="mt-0.5 shrink-0" /> {mensajeExito}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5" noValidate={false}>
          <div>
            <label htmlFor="email" className="field-label">Correo electrónico</label>
            <div className="relative">
              <Mail size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300" />
              <input id="email" type="email" autoComplete="email" className="input input-icon" placeholder="tu@correo.com"
                value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="field-label">Contraseña</label>
            <div className="relative">
              <Lock size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300" />
              <input id="password" type={verPass ? 'text' : 'password'} autoComplete="current-password"
                className="input input-icon pr-11" placeholder="Tu contraseña"
                value={password} onChange={e => setPassword(e.target.value)} required />
              <button type="button" onClick={() => setVerPass(v => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-600 dark:hover:bg-white/5"
                aria-label={verPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                {verPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error?.tipo === 'no_verificado' && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
              <p className="flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-200">
                <MailCheck size={18} /> Verifica tu correo
              </p>
              <p className="mt-1 text-[13px] text-amber-700 dark:text-amber-300/90">{error.mensaje}</p>
              {mensajeReenvio ? (
                <p className="mt-3 text-[13px] font-medium text-brand-700 dark:text-brand-300">{mensajeReenvio}</p>
              ) : (
                <button type="button" onClick={handleReenviar} disabled={reenviando}
                  className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-amber-800 underline-offset-2 hover:underline dark:text-amber-200">
                  <RefreshCw size={14} className={reenviando ? 'animate-spin' : ''} />
                  {reenviando ? 'Enviando…' : 'Reenviar correo de verificación'}
                </button>
              )}
            </div>
          )}

          {error?.tipo === 'generico' && (
            <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
              <CircleAlert size={18} className="mt-0.5 shrink-0" /> {error.mensaje}
            </div>
          )}

          <button type="submit" disabled={enviando} className="btn-primary btn-lg w-full">
            {enviando ? 'Verificando…' : <>Entrar <ArrowRight size={18} /></>}
          </button>
        </form>

        <p className="mt-7 text-center text-sm text-ink-500 dark:text-ink-400">
          ¿Aún no tienes cuenta?{' '}
          <Link to="/" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">Crea una gratis</Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default Login;
