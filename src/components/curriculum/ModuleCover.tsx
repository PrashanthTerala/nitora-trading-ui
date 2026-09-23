import type { CSSProperties } from 'react';
import { LEVELS, type Level, type ModuleMeta } from '@/content/curriculum';
import { cx } from '@/components/ui/cx';

/**
 * A module's cover. Until Phase 4 renders real artwork into `module.art`, this draws a
 * placeholder from the module's level colour: a tinted gradient over a faint grid, and a
 * silhouette of candles unique to the module (seeded from its id, so it never changes between
 * visits). Decorative either way -- the module's title is always printed beside it.
 */
type Variant = 'thumb' | 'card' | 'hero';

const levelVar = (level: Level) => `var(--color-level-${level})`;

export function ModuleCover({ module: mod, variant = 'card', className }: { module: ModuleMeta; variant?: Variant; className?: string }) {
  const style = { '--lv': levelVar(mod.level) } as CSSProperties;
  if (mod.art) {
    return (
      <div className={cx('relative overflow-hidden bg-surface-2', className)} style={style} aria-hidden>
        <img src={mod.art.dark} alt="" loading="lazy" decoding="async" className="hidden h-full w-full object-cover dark:block" />
        <img src={mod.art.light} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover dark:hidden" />
      </div>
    );
  }
  return (
    <div
      aria-hidden
      className={cx('relative isolate overflow-hidden bg-surface-2', className)}
      style={{
        ...style,
        backgroundImage:
          'radial-gradient(120% 95% at 88% 0%, color-mix(in oklch, var(--lv) 42%, transparent), transparent 62%), linear-gradient(165deg, color-mix(in oklch, var(--lv) 14%, var(--color-surface-2)), var(--color-surface-1))',
      }}
    >
      <CoverGrid />
      <CandleSilhouette seed={mod.id} dense={variant === 'hero'} clearLeft={variant !== 'thumb'} />
      {variant !== 'thumb' && (
        <span
          className={cx(
            'absolute bottom-0 left-0 font-display font-bold leading-none tracking-tight text-ink/80 tabular-nums',
            variant === 'hero' ? 'p-6 text-[clamp(4rem,10vw,7.5rem)]' : 'p-4 text-[2.75rem]',
          )}
        >
          {String(mod.number).padStart(2, '0')}
        </span>
      )}
    </div>
  );
}

// A CSS grid rather than an SVG <pattern>: a page shows many covers, and pattern ids would repeat.
function CoverGrid() {
  return (
    <div
      className="absolute inset-0 opacity-60"
      style={{
        backgroundImage: 'linear-gradient(var(--color-line-subtle) 1px, transparent 1px), linear-gradient(90deg, var(--color-line-subtle) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    />
  );
}

/** Deterministic pseudo-random numbers from a string, so each module keeps its own shape. */
function seeded(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

// With `clearLeft`, the candles keep to the right so the module number has the left to itself.
function CandleSilhouette({ seed, dense, clearLeft }: { seed: string; dense: boolean; clearLeft: boolean }) {
  const rand = seeded(seed);
  const n = dense ? 14 : 9;
  const x0 = clearLeft ? 38 : 0;
  const w = (100 - x0) / (n + 1);
  // A walk that drifts up, so every cover reads as a chart rather than noise.
  let price = 55 + rand() * 10;
  const bars = Array.from({ length: n }, (_, i) => {
    const open = price;
    const close = open + (rand() - 0.38) * 14;
    const high = Math.max(open, close) + rand() * 6;
    const low = Math.min(open, close) - rand() * 6;
    price = close;
    return { x: x0 + (i + 0.8) * w, open, close, high, low };
  });
  const lo = Math.min(...bars.map((b) => b.low));
  const hi = Math.max(...bars.map((b) => b.high));
  const y = (v: number) => 92 - ((v - lo) / Math.max(1, hi - lo)) * 64;
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
      {bars.map((b, i) => (
        <g key={i} opacity={0.25 + (i / n) * 0.55}>
          <line x1={b.x} x2={b.x} y1={y(b.high)} y2={y(b.low)} stroke="var(--lv)" strokeWidth={0.6} vectorEffect="non-scaling-stroke" />
          <rect
            x={b.x - w * 0.3}
            width={w * 0.6}
            y={y(Math.max(b.open, b.close))}
            height={Math.max(1, Math.abs(y(b.open) - y(b.close)))}
            rx={0.6}
            fill={b.close >= b.open ? 'var(--lv)' : 'none'}
            stroke="var(--lv)"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        </g>
      ))}
    </svg>
  );
}

/** A level's small identifier: a coloured dot and its name. */
export function LevelBadge({ level, className }: { level: Level; className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 text-caption font-semibold uppercase tracking-[0.08em] text-ink-soft', className)}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: levelVar(level) }} aria-hidden />
      {LEVELS[level].label}
    </span>
  );
}

/** A level's ribbon: a 3 px bar in the level colour, for the edge of a card or band. */
export function LevelRibbon({ level, className }: { level: Level; className?: string }) {
  return <span aria-hidden className={cx('block', className)} style={{ background: levelVar(level) }} />;
}
