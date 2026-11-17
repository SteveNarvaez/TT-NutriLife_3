// Ilustraciones del triaje: somatotipos y rangos de edad (SVG propio, sin dependencias)

// ── Somatotipo: pictograma frontal con guías de proporción ─────────────────
// Los parámetros son semianchos (px en un lienzo de 120×220) de hombros, cintura y cadera,
// más el grosor de brazos y piernas.
const CUERPOS = {
  ectomorfo: { hombro: 22, cintura: 13, cadera: 16, brazo: 7,  pierna: 9,  cuello: 4.5 },
  mesomorfo: { hombro: 31, cintura: 17, cadera: 20, brazo: 10, pierna: 12, cuello: 6   },
  endomorfo: { hombro: 27, cintura: 27, cadera: 29, brazo: 11, pierna: 14, cuello: 6.5 },
};

export function BodyFigure({ tipo, active = false }) {
  const c = CUERPOS[tipo] || CUERPOS.mesomorfo;
  const cx = 60;
  const yHombro = 58, yCintura = 106, yCadera = 128, yIngle = 138;
  const torso = [
    `M ${cx - c.cuello} 44`,
    `C ${cx - c.cuello} 50, ${cx - c.hombro + 6} 50, ${cx - c.hombro} ${yHombro}`,
    `C ${cx - c.hombro - 1} ${yHombro + 18}, ${cx - c.cintura - 1} ${yCintura - 22}, ${cx - c.cintura} ${yCintura}`,
    `C ${cx - c.cintura} ${yCintura + 10}, ${cx - c.cadera} ${yCadera - 8}, ${cx - c.cadera} ${yCadera}`,
    `L ${cx - c.cadera + 2} ${yIngle}`,
    `L ${cx + c.cadera - 2} ${yIngle}`,
    `L ${cx + c.cadera} ${yCadera}`,
    `C ${cx + c.cadera} ${yCadera - 8}, ${cx + c.cintura} ${yCintura + 10}, ${cx + c.cintura} ${yCintura}`,
    `C ${cx + c.cintura + 1} ${yCintura - 22}, ${cx + c.hombro + 1} ${yHombro + 18}, ${cx + c.hombro} ${yHombro}`,
    `C ${cx + c.hombro - 6} 50, ${cx + c.cuello} 50, ${cx + c.cuello} 44`,
    'Z',
  ].join(' ');

  const piernaX = c.cadera * 0.5 + 1;
  const tono = active ? 'text-brand-600 dark:text-brand-400' : 'text-ink-300 dark:text-ink-600';
  const guia = active ? 'stroke-brand-300 dark:stroke-brand-600' : 'stroke-ink-200 dark:stroke-ink-700';

  const guiaLinea = (y, w) => (
    <line key={y} x1={cx - w - 6} y1={y} x2={cx + w + 6} y2={y} />
  );

  return (
    <svg viewBox="0 0 120 220" className={`h-full w-full ${tono} transition-colors`} aria-hidden="true">
      {/* cabeza */}
      <circle cx={cx} cy="24" r="14" fill="currentColor" />
      {/* brazos */}
      <path d={`M ${cx - c.hombro + 2} ${yHombro + 2} C ${cx - c.hombro - 6} ${yHombro + 30}, ${cx - c.hombro - 6} ${yHombro + 52}, ${cx - c.hombro - 3} ${yHombro + 74}`}
        stroke="currentColor" strokeWidth={c.brazo} strokeLinecap="round" fill="none" />
      <path d={`M ${cx + c.hombro - 2} ${yHombro + 2} C ${cx + c.hombro + 6} ${yHombro + 30}, ${cx + c.hombro + 6} ${yHombro + 52}, ${cx + c.hombro + 3} ${yHombro + 74}`}
        stroke="currentColor" strokeWidth={c.brazo} strokeLinecap="round" fill="none" />
      {/* piernas */}
      <path d={`M ${cx - piernaX} ${yIngle - 4} L ${cx - piernaX + 1} 206`} stroke="currentColor" strokeWidth={c.pierna} strokeLinecap="round" />
      <path d={`M ${cx + piernaX} ${yIngle - 4} L ${cx + piernaX - 1} 206`} stroke="currentColor" strokeWidth={c.pierna} strokeLinecap="round" />
      {/* torso */}
      <path d={torso} fill="currentColor" />
      {/* guías de proporción: hombros, cintura y cadera */}
      <g className={guia} strokeWidth="1" strokeDasharray="2 3">
        {guiaLinea(yHombro + 2, c.hombro)}
        {guiaLinea(yCintura, c.cintura)}
        {guiaLinea(yCadera, c.cadera)}
      </g>
    </svg>
  );
}

// ── Rango de edad: anillo sobre la escala de vida adulta (18 a 80 años) ───
const MIN = 18, MAX = 80;
const polar = (r, a) => [60 + r * Math.cos(a), 60 + r * Math.sin(a)];
const arco = (r, desde, hasta) => {
  const a0 = -Math.PI * 1.25 + ((desde - MIN) / (MAX - MIN)) * Math.PI * 1.5;
  const a1 = -Math.PI * 1.25 + ((hasta - MIN) / (MAX - MIN)) * Math.PI * 1.5;
  const [x0, y0] = polar(r, a0);
  const [x1, y1] = polar(r, a1);
  const grande = a1 - a0 > Math.PI ? 1 : 0;
  return `M ${x0} ${y0} A ${r} ${r} 0 ${grande} 1 ${x1} ${y1}`;
};

export function AgeRing({ desde, hasta, etiqueta, active = false }) {
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden="true">
      <path d={arco(46, MIN, MAX)} className="stroke-ink-100 dark:stroke-white/10" strokeWidth="10" fill="none" strokeLinecap="round" />
      <path d={arco(46, desde, hasta)} strokeWidth="10" fill="none" strokeLinecap="round"
        className={active ? 'stroke-brand-500' : 'stroke-brand-300 dark:stroke-brand-700'} />
      <text x="60" y="62" textAnchor="middle" className={`font-sans text-[22px] font-bold ${active ? 'fill-brand-700 dark:fill-brand-300' : 'fill-ink-700 dark:fill-ink-200'}`}>
        {etiqueta}
      </text>
      <text x="60" y="80" textAnchor="middle" className="fill-ink-400 font-sans text-[9px] font-semibold tracking-[0.14em]">AÑOS</text>
    </svg>
  );
}
