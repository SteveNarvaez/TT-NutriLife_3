import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import Triaje from './pages/Triaje';
import Dashboard from './pages/Dashboard';
import Asistente from './pages/Asistente';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/triaje" element={<Triaje />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/asistente" element={<Dashboard><Asistente /></Dashboard>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;