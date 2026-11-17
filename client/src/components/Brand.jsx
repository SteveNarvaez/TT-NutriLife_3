// Logotipo oficial de NutriLife (versión clara y oscura)
export function Logo({ className = 'h-10', alt = 'NutriLife · Seguimiento Nutricional Inteligente' }) {
  return (
    <>
      <img src="/brand/logo-full.webp" alt={alt} className={`${className} w-auto max-w-full self-start object-contain object-left dark:hidden`} draggable="false" />
      <img src="/brand/logo-full-dark.webp" alt={alt} className={`${className} hidden w-auto max-w-full self-start object-contain object-left dark:block`} draggable="false" />
    </>
  );
}

// Solo el símbolo (hoja + pulso), para avatares y espacios pequeños
export function LogoMark({ className = 'h-8 w-8' }) {
  return <img src="/brand/logo-mark.webp" alt="" aria-hidden="true" className={`${className} object-contain`} draggable="false" />;
}

// Línea de pulso decorativa inspirada en el logotipo
export function PulseLine({ className = '', animated = true }) {
  return (
    <svg viewBox="0 0 260 40" className={className} fill="none" aria-hidden="true">
      <path
        d="M0 20 H92 L102 20 L110 6 L120 34 L130 2 L140 30 L148 20 H260"
        stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray="260" className={animated ? 'animate-pulse-line' : ''}
      />
    </svg>
  );
}

// Aviso médico estándar que acompaña a la app
export function MedicalNote({ className = '' }) {
  return (
    <p className={`text-[11.5px] leading-relaxed text-ink-400 dark:text-ink-500 ${className}`}>
      NutriLife ofrece información orientativa y no sustituye la consulta con un profesional de la salud.
    </p>
  );
}
