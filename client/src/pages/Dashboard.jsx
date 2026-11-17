import { useState, useEffect, useCallback } from 'react';
import {
  House, Bot, ChartColumn, Salad, ShieldCheck, LogOut, Moon, Sun, Menu, X, Scale, Flame, Dumbbell, CalendarCheck,
  Target, Gauge, ArrowRight, TriangleAlert, Sparkles, Loader2,
} from 'lucide-react';
import Asistente from './Asistente';
import MisGraficas from './MisGraficas';
import PlanDiario from './PlanDiario';
import { Logo, PulseLine, MedicalNote } from '../components/Brand';

// ─── Tema ──────────────────────────────────────────────────────────
const initTheme = () => {
  const saved = localStorage.getItem('nl_theme');
  if (saved) return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const NAV = [
  { id: 'inicio',   icon: House,       label: 'Inicio',        desc: 'Resumen de tu progreso' },
  { id: 'chat',     icon: Bot,         label: 'Asistente IA',  desc: 'Tu rutina, tu dieta y tus dudas' },
  { id: 'graficas', icon: ChartColumn, label: 'Mis gráficas',  desc: 'Calorías, macros y constancia' },
  { id: 'plan',     icon: Salad,       label: 'Plan diario',   desc: 'Tus objetivos de hoy' },
];
const NAV_ADMIN = { id: 'admin', icon: ShieldCheck, label: 'Administración', desc: 'Gestión del sistema' };

// ─── Piezas de UI ──────────────────────────────────────────────────
const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse rounded-lg bg-ink-100 dark:bg-white/10 ${className}`} />
);

const Avatar = ({ name, className = 'h-10 w-10 text-sm' }) => {
  const initials = (name || 'U').split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  return (
    <div className={`${className} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 font-semibold text-white`}>
      {initials}
    </div>
  );
};

const ThemeToggle = ({ theme, onToggle }) => (
  <button onClick={onToggle} className="btn-ghost h-10 w-10 p-0" aria-label={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
    title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}>
    {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
  </button>
);

const NavItem = ({ item, active, onClick }) => {
  const Icon = item.icon;
  return (
    <button onClick={onClick} aria-current={active ? 'page' : undefined}
      className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
        active
          ? 'bg-brand-600 text-white shadow-[0_8px_20px_-10px_rgb(24_122_79/0.8)]'
          : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900 dark:text-ink-300 dark:hover:bg-white/5 dark:hover:text-white'
      }`}>
      <Icon size={19} strokeWidth={active ? 2.2 : 1.9} className={active ? '' : 'text-ink-400 group-hover:text-brand-600 dark:group-hover:text-brand-400'} />
      <span className="flex-1 text-left">{item.label}</span>
    </button>
  );
};

function Sidebar({ open, onClose, vista, onNavigate, userName, userRol, onLogout }) {
  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-ink-950/40 backdrop-blur-sm lg:hidden" onClick={onClose} />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[264px] flex-col border-r border-ink-100 bg-white transition-transform duration-300
        dark:border-white/[0.06] dark:bg-ink-900 lg:static lg:translate-x-0 ${open ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-5 pb-4 pt-5">
          <Logo className="h-11" />
          <button onClick={onClose} className="btn-ghost p-2 lg:hidden" aria-label="Cerrar menú"><X size={18} /></button>
        </div>

        <nav className="scroll-thin flex-1 space-y-1 overflow-y-auto px-3 py-2" aria-label="Navegación principal">
          <p className="eyebrow px-3 pb-2 pt-1">Mi espacio</p>
          {NAV.map(item => (
            <NavItem key={item.id} item={item} active={vista === item.id} onClick={() => onNavigate(item.id)} />
          ))}
          {userRol === 'admin' && (
            <>
              <p className="eyebrow px-3 pb-2 pt-5">Gestión</p>
              <NavItem item={NAV_ADMIN} active={vista === 'admin'} onClick={() => onNavigate('admin')} />
            </>
          )}
        </nav>

        <div className="border-t border-ink-100 p-3 dark:border-white/[0.06]">
          <div className="flex items-center gap-3 rounded-xl p-2.5">
            <Avatar name={userName} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink-900 dark:text-white">{userName}</p>
              <p className="text-xs capitalize text-ink-400">{userRol === 'admin' ? 'Administrador' : 'Usuario'}</p>
            </div>
            <button onClick={onLogout} title="Cerrar sesión" aria-label="Cerrar sesión"
              className="rounded-lg p-2 text-ink-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

const ACENTOS = {
  blue:   'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400',
  amber:  'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
  violet: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400',
  brand:  'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400',
};

const StatCard = ({ icon: Icon, label, value, unit, acento, loading }) => (
  <div className="card card-hover p-5">
    <div className="flex items-center justify-between">
      <span className={`icon-tile ${ACENTOS[acento]}`}><Icon size={20} /></span>
    </div>
    {loading ? (
      <div className="mt-4 space-y-2"><Skeleton className="h-7 w-2/3" /><Skeleton className="h-3.5 w-1/2" /></div>
    ) : (
      <>
        <p className="mt-4 text-[26px] font-bold leading-none tracking-tight text-ink-900 tabular-nums dark:text-white">
          {value ?? '—'} <span className="text-sm font-medium text-ink-400">{value != null ? unit : ''}</span>
        </p>
        <p className="mt-1.5 text-[13px] text-ink-500 dark:text-ink-400">{label}</p>
      </>
    )}
  </div>
);

const ProgressRing = ({ value, max }) => {
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const r = 42, circ = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 100 100" className="h-28 w-28 -rotate-90">
      <circle cx="50" cy="50" r={r} className="stroke-ink-100 dark:stroke-white/10" strokeWidth="9" fill="none" />
      <circle cx="50" cy="50" r={r} className="stroke-brand-500 transition-all duration-700" strokeWidth="9" fill="none"
        strokeLinecap="round" strokeDasharray={`${pct * circ} ${circ}`} />
    </svg>
  );
};

const OBJETIVOS = {
  perder_peso: 'Perder peso', ganar_musculo: 'Ganar músculo', mantenimiento: 'Mantenimiento',
  'perder grasa': 'Perder grasa', 'ganar masa': 'Ganar masa muscular', mantener: 'Mantenimiento',
};

function VistaInicio({ userName, stats, loading, onNavigate }) {
  const objetivo = stats?.objetivo_actual;
  const objetivoLabel = OBJETIVOS[objetivo] || (objetivo ? objetivo.replace(/_/g, ' ') : 'Sin definir');
  const sesiones = Number(stats?.entrenamientos_mes) || 0;

  const STATS = [
    { icon: Scale,         label: 'Peso actual',             value: stats?.peso,               unit: 'kg',       acento: 'blue'   },
    { icon: Flame,         label: 'Meta calórica diaria',    value: stats?.meta_calorica != null ? Math.round(stats.meta_calorica).toLocaleString('es-MX') : null, unit: 'kcal', acento: 'amber' },
    { icon: Dumbbell,      label: 'Entrenamientos este mes', value: stats?.entrenamientos_mes, unit: 'sesiones', acento: 'violet' },
    { icon: CalendarCheck, label: 'Racha activa',            value: stats?.racha_dias,         unit: 'días',     acento: 'brand'  },
  ];

  return (
    <div className="space-y-6">
      {/* Bienvenida */}
      <section className="card relative overflow-hidden p-6 sm:p-7">
        <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="eyebrow">{new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink-900 sm:text-[28px] dark:text-white">
              Hola, {userName.split(' ')[0]}
            </h1>
            <p className="muted mt-1 max-w-md">Este es el resumen de tu alimentación y entrenamiento. Pide tu plan del día al asistente cuando lo necesites.</p>
          </div>
          <button onClick={() => onNavigate('chat')} className="btn-primary btn-lg shrink-0">
            <Sparkles size={18} /> Hablar con el asistente
          </button>
        </div>
        <PulseLine className="pointer-events-none absolute -right-6 bottom-3 h-16 w-[420px] text-brand-500/15" animated={false} />
      </section>

      {/* Aviso de triaje */}
      {!loading && stats && !stats.triaje_completado && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
          <TriangleAlert size={20} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">Completa tu evaluación de salud</p>
            <p className="text-[13px] text-amber-800/80 dark:text-amber-300/80">La necesitamos para personalizar tu plan nutricional y de ejercicio.</p>
          </div>
        </div>
      )}

      {/* Indicadores */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {STATS.map(s => <StatCard key={s.label} {...s} loading={loading} />)}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Perfil de objetivo */}
        <div className="card p-5 lg:col-span-1">
          <p className="eyebrow">Tu perfil</p>
          <div className="mt-4 space-y-4">
            <div className="flex items-center gap-3">
              <span className={`icon-tile ${ACENTOS.brand}`}><Target size={20} /></span>
              <div>
                <p className="text-xs text-ink-400">Objetivo</p>
                {loading ? <Skeleton className="mt-1 h-5 w-32" /> : <p className="font-semibold capitalize text-ink-900 dark:text-white">{objetivoLabel}</p>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`icon-tile ${ACENTOS.blue}`}><Gauge size={20} /></span>
              <div>
                <p className="text-xs text-ink-400">Nivel de actividad</p>
                {loading ? <Skeleton className="mt-1 h-5 w-24" /> : (
                  <p className="font-semibold capitalize text-ink-900 dark:text-white">{stats?.nivel_actividad?.replace(/_/g, ' ') || 'Sin definir'}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Progreso del mes */}
        <div className="card flex items-center gap-5 p-5 lg:col-span-1">
          <div className="relative">
            <ProgressRing value={sesiones} max={20} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold text-ink-900 tabular-nums dark:text-white">{loading ? '–' : sesiones}</span>
              <span className="text-[10px] text-ink-400">de 20</span>
            </div>
          </div>
          <div>
            <p className="eyebrow">Progreso del mes</p>
            <p className="mt-2 text-sm text-ink-600 dark:text-ink-300">
              {sesiones >= 20 ? '¡Meta mensual cumplida!' : `Te faltan ${Math.max(20 - sesiones, 0)} sesiones para tu meta de 20 entrenamientos.`}
            </p>
          </div>
        </div>

        {/* Accesos rápidos */}
        <div className="card p-5 lg:col-span-1">
          <p className="eyebrow">Accesos rápidos</p>
          <div className="mt-3 divide-y divide-ink-100 dark:divide-white/[0.06]">
            {NAV.slice(1).map(item => {
              const Icon = item.icon;
              return (
                <button key={item.id} onClick={() => onNavigate(item.id)}
                  className="group flex w-full items-center gap-3 py-3 text-left">
                  <span className="icon-tile h-9 w-9 bg-ink-50 text-ink-500 transition-colors group-hover:bg-brand-50 group-hover:text-brand-600 dark:bg-white/5 dark:group-hover:bg-brand-500/10">
                    <Icon size={18} />
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-semibold text-ink-800 dark:text-ink-100">{item.label}</span>
                    <span className="block text-xs text-ink-400">{item.desc}</span>
                  </span>
                  <ArrowRight size={16} className="text-ink-300 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-600" />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <MedicalNote className="pt-2 text-center" />
    </div>
  );
}

// Carga diferida del panel admin para no incluirlo en el bundle de usuarios normales
function AdminDashboardLoader() {
  const [Comp, setComp] = useState(null);
  useEffect(() => {
    import('./AdminDashboard').then(m => setComp(() => m.default)).catch(console.error);
  }, []);
  if (!Comp) return (
    <div className="flex h-64 items-center justify-center"><Loader2 size={32} className="animate-spin text-brand-500" /></div>
  );
  return <Comp />;
}

// ════════════════════════════════════════════════════════════════════
// DASHBOARD PRINCIPAL
// ════════════════════════════════════════════════════════════════════
export default function Dashboard({ onLogout }) {
  const [theme, setTheme]     = useState(initTheme);
  const [vista, setVista]     = useState('inicio');
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [, setPerfil]         = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const userId   = localStorage.getItem('userId');
  const userName = localStorage.getItem('userName') || 'Usuario';
  const userRol  = localStorage.getItem('userRol')  || 'usuario';

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('nl_theme', theme);
  }, [theme]);

  const fetchStats = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const authHeaders = { Authorization: `Bearer ${token}` };
      const [statsRes, perfilRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/graficas/stats/${userId}`, { headers: authHeaders }),
        fetch(`${import.meta.env.VITE_API_URL}/api/auth/perfil/${userId}`,    { headers: authHeaders }),
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

  const navigate = (v) => {
    setVista(v);
    setSidebarOpen(false);
    if (v === 'inicio') fetchStats();
  };

  const actual = vista === 'admin' ? NAV_ADMIN : NAV.find(n => n.id === vista);
  const esChat = vista === 'chat';

  return (
    <div className="flex h-dvh overflow-hidden bg-ink-50 dark:bg-ink-950">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} vista={vista} onNavigate={navigate}
        userName={userName} userRol={userRol} onLogout={onLogout} />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Encabezado */}
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-ink-100 bg-white/80 px-4 backdrop-blur-md dark:border-white/[0.06] dark:bg-ink-900/80 lg:px-8">
          <button onClick={() => setSidebarOpen(true)} className="btn-ghost -ml-2 p-2 lg:hidden" aria-label="Abrir menú"><Menu size={20} /></button>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-[15px] font-semibold text-ink-900 dark:text-white">{actual?.label}</h2>
            <p className="hidden truncate text-xs text-ink-400 sm:block">{actual?.desc}</p>
          </div>
          <ThemeToggle theme={theme} onToggle={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))} />
          <div className="hidden sm:block"><Avatar name={userName} className="h-9 w-9 text-xs" /></div>
        </header>

        <main className={`flex-1 ${esChat ? 'overflow-hidden p-3 sm:p-5 lg:p-6' : 'scroll-thin overflow-y-auto p-4 sm:p-6 lg:p-8'}`}>
          <div key={vista} className={`mx-auto w-full max-w-6xl animate-fade-up ${esChat ? 'h-full' : ''}`}>
            {vista === 'inicio'   && <VistaInicio userName={userName} stats={stats} loading={loading} onNavigate={navigate} />}
            {vista === 'chat'     && <Asistente />}
            {vista === 'graficas' && <MisGraficas />}
            {vista === 'plan'     && <PlanDiario />}
            {vista === 'admin'    && userRol === 'admin' && <AdminDashboardLoader />}
          </div>
        </main>
      </div>
    </div>
  );
}
