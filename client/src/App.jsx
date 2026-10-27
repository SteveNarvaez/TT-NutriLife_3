import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Register       from './pages/Register';
import Login          from './pages/Login';
import Triaje         from './pages/Triaje';
import Dashboard      from './pages/Dashboard';
import EmailVerificado from './pages/EmailVerificado';

// ─── Guard: requiere userId en localStorage ─────────────────────
function RequireAuth({ children }) {
  const userId = localStorage.getItem('userId');
  return userId ? children : <Navigate to="/login" replace />;
}

// ─── Guard: solo admins ─────────────────────────────────────────
function RequireAdmin({ children }) {
  const userId  = localStorage.getItem('userId');
  const userRol = localStorage.getItem('userRol');
  if (!userId)             return <Navigate to="/login"     replace />;
  if (userRol !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

function App() {
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Públicas */}
        <Route path="/"                element={<Register />} />
        <Route path="/login"           element={<Login    />} />
        <Route path="/verificar-email" element={<EmailVerificado />} />

        {/* Triaje: pública — se abre como popup desde el registro sin userId */}
        <Route path="/triaje" element={<Triaje />} />

        {/* Protegidas */}
        <Route path="/dashboard" element={
          <RequireAuth>
            <Dashboard onLogout={handleLogout} />
          </RequireAuth>
        } />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;