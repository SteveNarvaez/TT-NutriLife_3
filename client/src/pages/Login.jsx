import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
      e.preventDefault();
      try {
        const response = await axios.post('http://localhost:3000/api/auth/login', { 
          email, 
          password 
        });

        alert(response.data.message);
        
        // GUARDADO DINÁMICO (Limpio y sin errores)
        localStorage.setItem('userId', response.data.userId);
        localStorage.setItem('userName', response.data.user.nombre);
        
        console.log("✅ Login exitoso. ID guardado:", response.data.userId);
        
        navigate('/dashboard'); 

      } catch (err) {
        console.error("❌ Error capturado:", err.response?.data || err.message);
        alert(err.response?.data?.error || "Error al iniciar sesión");
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
              value={email} // <-- Siempre es bueno vincular el valor
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

          <button type="submit" className="w-full bg-green-500 text-white py-3 rounded-lg font-bold hover:bg-green-600 transition-colors shadow-lg shadow-green-200">
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