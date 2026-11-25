import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  User, Mail, Lock, Eye, EyeOff, Stethoscope, CircleCheck, ArrowRight, MailCheck, RefreshCw, CircleAlert, TriangleAlert,
} from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import Modal from '../components/Modal';
import Triaje from './Triaje';

// ── Pantalla que aparece DESPUÉS del registro exitoso ──
const PantallaVerificacion = ({ email, onReenviar, reenviando, mensajeReenvio }) => (
  <AuthLayout>
    <div className="card p-8 text-center">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
        <MailCheck size={32} />
      </span>
      <h2 className="mt-5 text-2xl font-bold tracking-tight text-ink-900 dark:text-white">Revisa tu correo</h2>
      <p className="muted mt-2">Enviamos un enlace de verificación a:</p>
      <p className="mt-1 break-all font-semibold text-brand-700 dark:text-brand-300">{email}</p>
      <p className="mt-3 text-sm text-ink-500 dark:text-ink-400">
        Abre el enlace para activar tu cuenta. Caduca en <strong>24 horas</strong>.
      </p>

      <div className="mt-6 rounded-xl bg-ink-50 p-4 text-left dark:bg-white/5">
        <p className="text-[13px] font-semibold text-ink-700 dark:text-ink-200">¿No llegó el correo?</p>
        <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-[13px] text-ink-500 dark:text-ink-400">
          <li>Revisa la carpeta de spam o correo no deseado.</li>
          <li>Puede tardar hasta 2 minutos en llegar.</li>
          <li>Verifica que el correo esté bien escrito.</li>
        </ul>
      </div>

      {mensajeReenvio && <p className="mt-4 text-sm font-medium text-brand-700 dark:text-brand-300">{mensajeReenvio}</p>}

      <button onClick={onReenviar} disabled={reenviando} className="btn-secondary mt-6 w-full">
        <RefreshCw size={16} className={reenviando ? 'animate-spin' : ''} />
        {reenviando ? 'Enviando…' : 'Reenviar correo de verificación'}
      </button>
      <Link to="/login" className="btn-primary mt-3 w-full">Ya verifiqué, iniciar sesión <ArrowRight size={16} /></Link>
    </div>
  </AuthLayout>
);

// ── Formulario de registro principal ──
const Register = () => {
  const [formData, setFormData] = useState({
    nombre: '', email: '', password: '',
    fecha_nacimiento: '', sexo: 'Masculino',
    acepto_disclaimer: false,
  });
  const [verPass, setVerPass]                   = useState(false);
  const [triajeAbierto, setTriajeAbierto]       = useState(false);
  const [triajeCompletado, setTriajeCompletado] = useState(false);
  const [triajeApto, setTriajeApto]             = useState(true);
  const [registrado, setRegistrado]             = useState(false);
  const [emailRegistrado, setEmailRegistrado]   = useState('');
  const [enviando, setEnviando]                 = useState(false);
  const [error, setError]                       = useState('');
  const [reenviando, setRenviando]              = useState(false);
  const [mensajeReenvio, setMensajeReenvio]     = useState('');

  // Compatibilidad: si el triaje se abre como ventana independiente (/triaje)
  useEffect(() => {
    const handler = (e) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === 'TRIAJE_COMPLETADO') guardarTriaje(e.data.payload);
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const guardarTriaje = (payload) => {
    sessionStorage.setItem('triaje_data', JSON.stringify(payload));
    setTriajeCompletado(true);
    setTriajeApto(payload?.apto_alto_impacto !== false);
  };

  const cerrarTriaje = useCallback(() => setTriajeAbierto(false), []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!triajeCompletado) {
      setError('Debes completar el triaje de salud antes de crear tu cuenta.');
      return;
    }
    setEnviando(true);
    try {
      // 1. Crear la cuenta
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/register`, formData);
      const { userId } = res.data;

      // 2. Guardar el triaje vinculado al usuario
      const triajeData = JSON.parse(sessionStorage.getItem('triaje_data') || '{}');
      if (userId && Object.keys(triajeData).length > 0) {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/triaje/guardar`, {
          ...triajeData,
          id_usuario: userId,
        });
      }
      sessionStorage.removeItem('triaje_data');

      // 3. Ir directo al login
      window.location.href = '/login';
    } catch (err) {
      const mensaje = err.response?.data?.error || 'No pudimos conectar con el servidor. Intenta de nuevo.';
      if (mensaje.includes('usuarios_email_key') || mensaje.includes('ya está registrado')) {
        setError('Este correo ya está registrado. Inicia sesión con tu cuenta.');
      } else {
        setError(mensaje);
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
        email: emailRegistrado,
      });
      setMensajeReenvio(res.data.message || 'Correo reenviado. Revisa tu bandeja.');
    } catch {
      setMensajeReenvio('Error al reenviar. Intenta de nuevo.');
    } finally {
      setRenviando(false);
    }
  };

  if (registrado) {
    return (
      <PantallaVerificacion email={emailRegistrado} onReenviar={handleReenviar}
        reenviando={reenviando} mensajeReenvio={mensajeReenvio} />
    );
  }

  const set = (campo) => (e) => setFormData({ ...formData, [campo]: e.target.value });

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} className="card p-7 sm:p-9">
        <div className="mb-6">
          <p className="eyebrow">Crea tu cuenta</p>
          <h2 className="mt-2 text-[26px] font-bold tracking-tight text-ink-900 dark:text-white">Únete a NutriLife</h2>
          <p className="muted mt-1">Tu plan personalizado empieza con unos datos básicos.</p>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="nombre" className="field-label">Nombre completo</label>
            <div className="relative">
              <User size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300" />
              <input id="nombre" type="text" autoComplete="name" className="input input-icon" placeholder="Nombre y apellidos"
                value={formData.nombre} onChange={set('nombre')} required />
            </div>
          </div>
          <div>
            <label htmlFor="email" className="field-label">Correo electrónico</label>
            <div className="relative">
              <Mail size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300" />
              <input id="email" type="email" autoComplete="email" className="input input-icon" placeholder="tu@correo.com"
                value={formData.email} onChange={set('email')} required />
            </div>
          </div>
          <div>
            <label htmlFor="password" className="field-label">Contraseña</label>
            <div className="relative">
              <Lock size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300" />
              <input id="password" type={verPass ? 'text' : 'password'} autoComplete="new-password" minLength={8}
                className="input input-icon pr-11" placeholder="Mínimo 8 caracteres"
                value={formData.password} onChange={set('password')} required />
              <button type="button" onClick={() => setVerPass(v => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-600 dark:hover:bg-white/5"
                aria-label={verPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                {verPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="nac" className="field-label">Fecha de nacimiento</label>
              <input id="nac" type="date" className="input" value={formData.fecha_nacimiento} onChange={set('fecha_nacimiento')} required />
            </div>
            <div>
              <label htmlFor="sexo" className="field-label">Sexo</label>
              <select id="sexo" className="input" value={formData.sexo} onChange={set('sexo')}>
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── TRIAJE ── */}
        <div className={`mt-6 flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border p-4 transition-colors ${
          triajeCompletado
            ? 'border-brand-200 bg-brand-50/70 dark:border-brand-500/30 dark:bg-brand-500/10'
            : 'border-ink-200 bg-ink-50/70 dark:border-white/10 dark:bg-white/[0.03]'
        }`}>
          <span className={`icon-tile ${triajeCompletado ? 'bg-brand-600 text-white' : 'bg-white text-brand-600 shadow-[var(--shadow-soft)] dark:bg-white/5'}`}>
            {triajeCompletado ? <CircleCheck size={20} /> : <Stethoscope size={20} />}
          </span>
          <div className="min-w-[10rem] flex-1">
            <p className="text-sm font-semibold text-ink-900 dark:text-white">
              {triajeCompletado ? 'Triaje de salud completado' : 'Triaje de salud requerido'}
            </p>
            <p className="text-[12.5px] text-ink-500 dark:text-ink-400">
              {triajeCompletado
                ? (triajeApto ? 'Tu perfil de salud quedó registrado.' : 'Registrado. Se recomienda supervisión médica para ejercicio intenso.')
                : 'Cuestionario breve sobre tu salud (≈ 3 minutos).'}
            </p>
          </div>
          <button type="button" onClick={() => setTriajeAbierto(true)}
            className={triajeCompletado ? 'btn-ghost shrink-0 text-xs max-sm:w-full' : 'btn-primary shrink-0 max-sm:w-full'}>
            {triajeCompletado ? 'Revisar' : <>Iniciar <ArrowRight size={16} /></>}
          </button>
        </div>
        {triajeCompletado && !triajeApto && (
          <p className="mt-2 flex items-center gap-1.5 text-[12.5px] text-amber-700 dark:text-amber-300">
            <TriangleAlert size={14} /> Requiere supervisión médica para ejercicio de alta intensidad.
          </p>
        )}

        {/* ── AVISO ── */}
        <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl p-1">
          <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-brand-600"
            checked={formData.acepto_disclaimer}
            onChange={e => setFormData({ ...formData, acepto_disclaimer: e.target.checked })} required />
          <span className="text-[12.5px] leading-relaxed text-ink-500 dark:text-ink-400">
            Acepto los <span className="font-semibold text-brand-700 dark:text-brand-300">términos y condiciones médicos</span> de NutriLife.
            Entiendo que esta aplicación no reemplaza la consulta médica profesional.
          </span>
        </label>

        {error && (
          <div role="alert" className="mt-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            <CircleAlert size={18} className="mt-0.5 shrink-0" /> {error}
          </div>
        )}

        <button type="submit" disabled={!formData.acepto_disclaimer || !triajeCompletado || enviando} className="btn-primary btn-lg mt-5 w-full">
          {enviando ? 'Creando tu cuenta…' : <>Crear mi cuenta <ArrowRight size={18} /></>}
        </button>

        <p className="mt-6 text-center text-sm text-ink-500 dark:text-ink-400">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">Inicia sesión</Link>
        </p>
      </form>

      {/* Triaje en ventana centrada */}
      <Modal open={triajeAbierto} onClose={cerrarTriaje} label="Triaje de salud">
        <Triaje modoModal onCompletado={guardarTriaje} onCerrar={cerrarTriaje} />
      </Modal>
    </AuthLayout>
  );
};

export default Register;
