import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

// Ventana modal centrada en pantalla, con cierre por Escape y bloqueo del scroll de fondo
export default function Modal({ open, onClose, label, children }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    ref.current?.focus();
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      <div className="absolute inset-0 bg-ink-950/45 backdrop-blur-sm animate-[fade-up_0.2s_ease-out]" onClick={onClose} />
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={label}
        className="relative flex max-h-full w-full justify-center outline-none animate-scale-in">
        {children}
      </div>
    </div>,
    document.body
  );
}
