import { Bot, Salad, ShieldCheck } from 'lucide-react';
import { Logo, PulseLine, MedicalNote } from './Brand';

const PUNTOS = [
  { icon: Bot,         titulo: 'Asistente inteligente',   texto: 'Pregunta por tu rutina, tu dieta o tus calorías en lenguaje natural.' },
  { icon: Salad,       titulo: 'Planes personalizados',   texto: 'Dieta semanal y rutina mensual calculadas con tus datos y tu somatotipo.' },
  { icon: ShieldCheck, titulo: 'Triaje de salud',         texto: 'Un cuestionario clínico identifica cuándo necesitas supervisión médica.' },
];

// Contenedor de las pantallas de acceso: panel de marca + formulario
export default function AuthLayout({ children }) {
  return (
    <div className="bg-aurora min-h-screen">
      <div className="mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[1.05fr_1fr]">
        {/* Panel de marca (escritorio) */}
        <aside className="relative hidden flex-col justify-between overflow-hidden px-12 py-12 lg:flex">
          <Logo className="h-14" />

          <div className="max-w-md animate-fade-up">
            <span className="chip-brand">Nutrición basada en datos</span>
            <h1 className="mt-5 text-[40px] font-extrabold leading-[1.08] tracking-tight text-ink-900 dark:text-white">
              Tu alimentación y tu entrenamiento, <span className="text-brand-600 dark:text-brand-400">en un solo lugar.</span>
            </h1>
            <PulseLine className="mt-6 h-8 w-64 text-brand-500" />
            <ul className="mt-8 space-y-5">
              {PUNTOS.map(({ icon: Icon, titulo, texto }) => (
                <li key={titulo} className="flex gap-4">
                  <span className="icon-tile bg-white text-brand-600 shadow-[var(--shadow-soft)] dark:bg-white/5 dark:text-brand-400">
                    <Icon size={20} strokeWidth={2} />
                  </span>
                  <div>
                    <p className="font-semibold text-ink-900 dark:text-white">{titulo}</p>
                    <p className="text-sm text-ink-500 dark:text-ink-400">{texto}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <MedicalNote className="max-w-sm" />

          {/* Hoja decorativa */}
          <svg viewBox="0 0 200 200" className="pointer-events-none absolute -bottom-16 -right-16 h-72 w-72 text-brand-500/10" aria-hidden="true">
            <path fill="currentColor" d="M170 20C90 20 30 70 30 140c0 15 3 28 8 40 10-40 40-80 90-100-40 25-65 60-75 100 70 0 117-55 117-160z" />
          </svg>
        </aside>

        {/* Contenido */}
        <main className="flex min-h-screen flex-col items-center justify-center px-5 py-10 sm:px-8">
          <div className="mb-8 lg:hidden"><Logo className="h-12" /></div>
          <div className="w-full max-w-md animate-fade-up">{children}</div>
          <MedicalNote className="mt-8 max-w-md text-center lg:hidden" />
        </main>
      </div>
    </div>
  );
}
