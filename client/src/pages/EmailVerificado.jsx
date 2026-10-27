import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';

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
      .get(`http://localhost:3000/api/auth/verificar-email?token=${token}`)
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-6">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg border border-gray-100 text-center">

        {estado === 'cargando' && (
          <>
            <div className="text-5xl mb-4 animate-pulse">⏳</div>
            <h2 className="text-xl font-bold text-gray-600">Verificando tu correo...</h2>
          </>
        )}

        {estado === 'ok' && (
          <>
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-extrabold text-green-600 mb-2">
              ¡Cuenta verificada{nombre ? `, ${nombre}` : ''}!
            </h2>
            <p className="text-gray-500 mb-8">{mensaje}</p>
            <Link
              to="/login"
              className="inline-block w-full bg-green-500 hover:bg-green-600 text-white font-bold p-3 rounded-xl transition shadow-lg"
            >
              Iniciar sesión →
            </Link>
          </>
        )}

        {estado === 'error' && (
          <>
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-extrabold text-red-500 mb-2">Enlace inválido o expirado</h2>
            <p className="text-gray-500 mb-8">{mensaje}</p>
            <div className="flex flex-col gap-3">
              <Link
                to="/register"
                className="inline-block w-full bg-green-500 hover:bg-green-600 text-white font-bold p-3 rounded-xl transition shadow-lg"
              >
                Volver al registro
              </Link>
              <Link
                to="/login"
                className="inline-block w-full border-2 border-gray-200 text-gray-500 font-bold p-3 rounded-xl hover:bg-gray-50 transition"
              >
                Ir al login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EmailVerificado;