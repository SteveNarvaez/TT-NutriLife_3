import { useState, useEffect, useCallback } from 'react';
import Asistente from './Asistente';
import MisGraficas from './MisGraficas';
import PlanDiario from './PlanDiario';

// ─── Contexto de tema ──────────────────────────────────────────────
const initTheme = () => {
  const saved = localStorage.getItem('nl_theme');
  if (saved) return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

// ─── Skeleton loader ───────────────────────────────────────────────
const Skeleton = ({ w = '100%', h = '1rem', rounded = 'rounded-lg', className = '' }) => (
  <div
    className={`animate-pulse bg-gray-200 dark:bg-gray-700 ${rounded} ${className}`}
    style={{ width: w, height: h }}
  />
);

// ─── Stat Card ─────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, unit, color, loading }) => (
  <div className={`
    relative overflow-hidden rounded-2xl p-5
    bg-white/60 dark:bg-gray-800/60 backdrop-blur-md
    border border-white/30 dark:border-gray-700/50
    shadow-lg hover:shadow-xl hover:-translate-y-0.5
    transition-all duration-200
  `}>
    <div className={`absolute top-0 right-0 w-20 h-20 rounded-full -mr-6 -mt-6 opacity-10 ${color}`} />
    <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${color} bg-opacity-15 mb-3`}>
      <span className="text-xl">{icon}</span>
    </div>
    {loading ? (
      <>
        <Skeleton h="1.5rem" w="60%" className="mb-1" />
        <Skeleton h="0.875rem" w="40%" />
      </>
    ) : (
      <>
        <div className="text-2xl font-bold text-gray-800 dark:text-white">
          {value ?? '—'} <span className="text-sm font-normal text-gray-500 dark:text-gray-400">{unit}</span>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</div>
      </>
    )}
  </div>
);

// ─── Nav item ──────────────────────────────────────────────────────
const NavItem = ({ icon, label, active, onClick, badge }) => (
  <button
    onClick={onClick}
    className={`
      w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
      transition-all duration-150 group relative
      ${active
        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'}
    `}
  >
    <span className="text-lg">{icon}</span>
    <span className="flex-1 text-left">{label}</span>
    {badge && (
      <span className="w-5 h-5 text-xs rounded-full bg-red-500 text-white flex items-center justify-center">
        {badge}
      </span>
    )}
    {active && (
      <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse" />
    )}
  </button>
);

// ─── Avatar / Initials ─────────────────────────────────────────────
const Avatar = ({ name, size = 'md' }) => {
  const initials = (name || 'U').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' };
  return (
    <div className={`${sizes[size]} rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {initials}
    </div>
  );
};

// ─── Barra de progreso ─────────────────────────────────────────────
const ProgressBar = ({ value, max, color = 'bg-emerald-500', label }) => {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div>
      {label && <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex justify-between">
        <span>{label}</span><span>{Math.round(pct)}%</span>
      </div>}
      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════
// DASHBOARD PRINCIPAL
// ════════════════════════════════════════════════════════════════════
export default function Dashboard({ onLogout }) {
  const [theme, setTheme]   = useState(initTheme);
  const [vista, setVista]   = useState('inicio');
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [perfil, setPerfil] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const userId   = localStorage.getItem('userId');
  const userName = localStorage.getItem('userName') || 'Usuario';
  const userRol  = localStorage.getItem('userRol')  || 'usuario';

  // ── Tema ──────────────────────────────────────────────────────────
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('nl_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  // ── Datos ─────────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const [statsRes, perfilRes] = await Promise.all([
        fetch(`http://localhost:3000/api/graficas/stats/${userId}`),
        fetch(`http://localhost:3000/api/auth/perfil/${userId}`)
      ]);
      if (statsRes.ok)  setStats(await statsRes.json());
      if (perfilRes.ok) setPerfil(await perfilRes.json());
    } catch (err) {
      console.error('Error cargando stats:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  // ── Cerrar sidebar al cambiar vista en móvil ──────────────────────
  const navigate = (v) => { setVista(v); setSidebarOpen(false); };

  const NAV = [
    { id: 'inicio',   icon: '🏠', label: 'Inicio'        },
    { id: 'chat',     icon: '🤖', label: 'Asistente IA'  },
    { id: 'graficas', icon: '📊', label: 'Mis Gráficas'  },
    { id: 'plan',     icon: '🥗', label: 'Plan Diario'   },
  ];

  const STAT_CARDS = [
    { icon: '⚖️',  label: 'Peso actual',          value: stats?.peso,               unit: 'kg',         color: 'bg-blue-500'    },
    { icon: '🔥',  label: 'Meta calórica diaria',  value: stats?.meta_calorica,      unit: 'kcal',       color: 'bg-orange-500'  },
    { icon: '💪',  label: 'Entrenamientos este mes',value: stats?.entrenamientos_mes, unit: 'sesiones',   color: 'bg-violet-500'  },
    { icon: '📅',  label: 'Racha activa',           value: stats?.racha_dias,         unit: 'días',       color: 'bg-emerald-500' },
  ];

  // ─── Sidebar ────────────────────────────────────────────────────
  const Sidebar = () => (
    <>
      {/* Overlay móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed top-0 left-0 h-full z-30
        w-64 flex flex-col
        bg-white/80 dark:bg-gray-900/90 backdrop-blur-xl
        border-r border-gray-100 dark:border-gray-800
        shadow-2xl lg:shadow-none
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 pt-6 pb-4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow">
            <span className="text-white text-lg">🌿</span>
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
            NutriLife
          </span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >✕</button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {NAV.map(item => (
            <NavItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={vista === item.id}
              onClick={() => navigate(item.id)}
            />
          ))}

          {/* Enlace a admin si corresponde */}
          {userRol === 'admin' && (
            <>
              <div className="my-2 border-t border-gray-100 dark:border-gray-800" />
              <NavItem
                icon="🛡️"
                label="Panel de Admin"
                active={vista === 'admin'}
                onClick={() => navigate('admin')}
              />
            </>
          )}
        </nav>

        {/* Perfil usuario */}
        <div className="p-3 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60">
            <Avatar name={userName} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{userName}</p>
              <p className="text-xs text-gray-400 capitalize">{userRol}</p>
            </div>
            <button
              onClick={onLogout}
              title="Cerrar sesión"
              className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>
    </>
  );

  // ─── Header móvil ─────────────────────────────────────────────
  const MobileHeader = () => (
    <div className="lg:hidden flex items-center gap-3 px-4 py-3
      bg-white/80 dark:bg-gray-900/80 backdrop-blur-md
      border-b border-gray-100 dark:border-gray-800 sticky top-0 z-10">
      <button
        onClick={() => setSidebarOpen(true)}
        className="text-gray-500 dark:text-gray-300 hover:text-emerald-600"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <span className="flex-1 text-sm font-semibold text-gray-700 dark:text-white">
        {NAV.find(n => n.id === vista)?.label ?? 'NutriLife'}
      </span>
      <ThemeToggle />
    </div>
  );

  // ─── Toggle tema ───────────────────────────────────────────────
  const ThemeToggle = () => (
    <button
      onClick={toggleTheme}
      className="w-9 h-9 flex items-center justify-center rounded-xl
        bg-gray-100 dark:bg-gray-700
        hover:bg-gray-200 dark:hover:bg-gray-600
        text-gray-600 dark:text-gray-300
        transition-all duration-150"
      title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );

  // ─── Vista inicio ───────────────────────────────────────────────
  const VistaInicio = () => {
    const objetivo = stats?.objetivo_actual;
    const objetivoLabel = {
      perder_peso: '⬇️ Perder peso',
      ganar_musculo: '💪 Ganar músculo',
      mantenimiento: '⚖️ Mantenimiento',
    }[objetivo] || (objetivo || 'Sin definir');

    return (
      <div className="space-y-6">
        {/* Saludo */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              ¡Hola, {userName.split(' ')[0]}! 👋
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          {/* Theme toggle desktop */}
          <div className="hidden lg:block">
            <ThemeToggle />
          </div>
        </div>

        {/* Alerta triaje */}
        {!loading && !stats?.triaje_completado && (
          <div className="flex items-center gap-3 p-4 rounded-2xl
            bg-amber-50 dark:bg-amber-900/20
            border border-amber-200 dark:border-amber-700/50">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                Completa tu evaluación de salud
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                Para personalizar tu plan nutricional y de ejercicio
              </p>
            </div>
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4">
          {STAT_CARDS.map(card => (
            <StatCard key={card.label} {...card} loading={loading} />
          ))}
        </div>

        {/* Resumen objetivo + nivel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Objetivo */}
          <div className="rounded-2xl p-5 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md border border-white/30 dark:border-gray-700/50 shadow-lg">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">Objetivo</p>
            {loading ? <Skeleton h="1.5rem" w="70%" /> : (
              <p className="text-lg font-bold text-gray-800 dark:text-white">{objetivoLabel}</p>
            )}
          </div>

          {/* Nivel actividad */}
          <div className="rounded-2xl p-5 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md border border-white/30 dark:border-gray-700/50 shadow-lg">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">Nivel de actividad</p>
            {loading ? <Skeleton h="1.5rem" w="50%" /> : (
              <p className="text-lg font-bold text-gray-800 dark:text-white capitalize">
                {stats?.nivel_actividad?.replace(/_/g, ' ') || '—'}
              </p>
            )}
          </div>
        </div>

        {/* Constancia mes (barra) */}
        {!loading && stats?.entrenamientos_mes > 0 && (
          <div className="rounded-2xl p-5 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md border border-white/30 dark:border-gray-700/50 shadow-lg">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-4">Progreso del mes</p>
            <ProgressBar
              value={stats.entrenamientos_mes}
              max={20}
              label={`${stats.entrenamientos_mes} / 20 sesiones objetivo`}
            />
          </div>
        )}

        {/* Accesos rápidos */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">Accesos rápidos</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: '🤖', label: 'Chat IA', view: 'chat', color: 'from-violet-400 to-purple-600' },
              { icon: '📊', label: 'Gráficas', view: 'graficas', color: 'from-blue-400 to-cyan-600' },
              { icon: '🥗', label: 'Mi Plan', view: 'plan', color: 'from-emerald-400 to-teal-600' },
            ].map(item => (
              <button
                key={item.view}
                onClick={() => setVista(item.view)}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl
                  bg-white/60 dark:bg-gray-800/60 backdrop-blur-md
                  border border-white/30 dark:border-gray-700/50
                  hover:shadow-lg hover:-translate-y-0.5
                  transition-all duration-150"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow text-lg`}>
                  {item.icon}
                </div>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ─── Render ────────────────────────────────────────────────────
  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50/50 to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex">
      <Sidebar />

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col min-w-0">
        <MobileHeader />

        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          {/* Vista actual */}
          {vista === 'inicio'   && <VistaInicio />}
          {vista === 'chat'     && <Asistente />}
          {vista === 'graficas' && <MisGraficas />}
          {vista === 'plan'     && <PlanDiario />}
          {vista === 'admin'    && userRol === 'admin' && (
            <AdminDashboardLoader />
          )}
        </main>
      </div>
    </div>
  );
}

// Lazy-load del panel admin para no incluirlo en el bundle de usuarios normales
function AdminDashboardLoader() {
  const [Comp, setComp] = useState(null);
  useEffect(() => {
    import('./AdminDashboard').then(m => setComp(() => m.default)).catch(console.error);
  }, []);
  if (!Comp) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  return <Comp />;
}
