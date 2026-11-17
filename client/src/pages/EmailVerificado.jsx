import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { BadgeCheck, CircleAlert, Loader2, ArrowRight } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';

const EmailVerificado = () => {
  const [searchParams] = useSearchParams();
  const [estado, setEstado]   = useState('cargando'); // 'cargando' | 'ok' | 'error'
  const [mensaje, setMensaje] = useState('');
  const [nombre, setNombre]   = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setEstado('error');
      setMensaje('Enlace inválido. No se encontró el token de verificación.');
      return;
    }

    axios
      .get(`${import.meta.env.VITE_API_URL}/api/auth/verificar-email?token=${token}`)
      .then((res) => {
        setEstado('ok');
        setNombre(res.data.nombre || '');
        setMensaje(res.data.message || '¡Tu correo fue verificado!');
      })
      .catch((err) => {
        setEstado('error');
        setMensaje(
          err.response?.data?.error ||
          'Ocurrió un error al verificar tu correo. El enlace puede haber expirado.'
        );
      });
  }, [searchParams]);

  return (
    <AuthLayout>
      <div className="card p-8 text-center">
        {estado === 'cargando' && (
          <>
            <Loader2 size={40} className="mx-auto animate-spin text-brand-500" />
            <h2 className="mt-5 text-xl font-bold text-ink-900 dark:text-white">Verificando tu correo…</h2>
            <p className="muted mt-2">Esto tomará solo un momento.</p>
          </>
        )}

        {estado === 'ok' && (
          <>
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
              <BadgeCheck size={34} />
            </span>
            <h2 className="mt-5 text-2xl font-bold tracking-tight text-ink-900 dark:text-white">
              Cuenta verificada{nombre ? `, ${nombre}` : ''}
            </h2>
            <p className="muted mt-2">{mensaje}</p>
            <Link to="/login" className="btn-primary btn-lg mt-7 w-full">Iniciar sesión <ArrowRight size={18} /></Link>
          </>
        )}

        {estado === 'error' && (
          <>
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
              <CircleAlert size={34} />
            </span>
            <h2 className="mt-5 text-2xl font-bold tracking-tight text-ink-900 dark:text-white">No pudimos verificar tu correo</h2>
            <p className="muted mt-2">{mensaje}</p>
            <div className="mt-7 grid gap-3">
              <Link to="/login" className="btn-primary w-full">Ir a iniciar sesión</Link>
              <Link to="/" className="btn-secondary w-full">Crear una cuenta nueva</Link>
            </div>
            <p className="mt-5 text-xs text-ink-400">Desde el inicio de sesión puedes solicitar que te reenviemos el enlace.</p>
          </>
        )}
      </div>
    </AuthLayout>
  );
};

export default EmailVerificado;
