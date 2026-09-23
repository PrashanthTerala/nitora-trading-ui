import { t } from '@/i18n';

/**
 * The hero's still image: glass candlesticks rising and then turning down, over a receding
 * grid. It is the poster the Phase 4 3D scene will sit on and fall back to, drawn as inline SVG
 * with theme tokens so it needs no image request and follows light and dark.
 *
 * The bars are a fixed shape, not market data -- this is an illustration, and it says so.
 */
const BARS: [open: number, high: number, low: number, close: number][] = [
  [42, 50, 38, 48],
  [48, 60, 45, 57],
  [57, 62, 51, 54],
  [54, 71, 53, 69],
  [69, 82, 66, 79],
  [79, 88, 74, 76],
  [76, 78, 61, 63],
  [63, 67, 52, 56],
];

const X0 = 110;
const STEP = 52;
const BODY = 30;
// Price 88 (the top wick) sits at y 60 and 38 (the lowest wick) at y 300, just above the floor.
const y = (v: number) => 60 + (88 - v) * 4.8;

export function HeroPoster() {
  return (
    <svg viewBox="0 0 560 480" role="img" aria-label={t('home.posterLabel')} className="h-auto w-full">
      <defs>
        <radialGradient id="hero-glow" cx="0.55" cy="0.42" r="0.5">
          <stop offset="0" stopColor="var(--color-accent)" stopOpacity={0.32} />
          <stop offset="1" stopColor="var(--color-accent)" stopOpacity={0} />
        </radialGradient>
        <linearGradient id="hero-floor" gradientUnits="userSpaceOnUse" x1="0" x2="0" y1="330" y2="480">
          <stop offset="0" stopColor="var(--color-line)" stopOpacity={0} />
          <stop offset="1" stopColor="var(--color-line)" stopOpacity={1} />
        </linearGradient>
        <linearGradient id="hero-glass" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="var(--color-ink)" stopOpacity={0.22} />
          <stop offset="0.35" stopColor="var(--color-ink)" stopOpacity={0.04} />
          <stop offset="1" stopColor="var(--color-ink)" stopOpacity={0} />
        </linearGradient>
      </defs>

      <rect width="560" height="480" fill="url(#hero-glow)" />

      {/* the floor: lines receding to a vanishing point above the chart */}
      <g stroke="url(#hero-floor)" strokeWidth={1}>
        {Array.from({ length: 13 }, (_, i) => (
          <line key={`r${i}`} x1={280 + (i - 6) * 18} y1={330} x2={280 + (i - 6) * 110} y2={480} />
        ))}
        {[338, 352, 372, 400, 438].map((ly) => (
          <line key={`h${ly}`} x1={0} x2={560} y1={ly} y2={ly} />
        ))}
      </g>

      {BARS.map(([o, h, l, c], i) => {
        const up = c >= o;
        const x = X0 + i * STEP;
        const top = y(Math.max(o, c));
        const height = Math.abs(y(o) - y(c));
        const color = up ? 'var(--color-up)' : 'var(--color-down)';
        return (
          <g key={i}>
            <line x1={x + BODY / 2} x2={x + BODY / 2} y1={y(h)} y2={y(l)} stroke={color} strokeWidth={2} strokeLinecap="round" opacity={0.85} />
            <rect x={x} y={top} width={BODY} height={height} rx={5} fill={color} fillOpacity={0.3} stroke={color} strokeOpacity={0.9} strokeWidth={1.5} />
            <rect x={x + 1.5} y={top + 1.5} width={BODY - 3} height={Math.max(0, height - 3)} rx={4} fill="url(#hero-glass)" />
          </g>
        );
      })}
    </svg>
  );
}
