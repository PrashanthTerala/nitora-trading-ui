import { useId } from 'react';
import { cx } from './cx';

/**
 * A tiny line (optionally with a soft area under it) for trends too small to need an axis:
 * a KPI tile, a card preview. Scales to its box; the stroke stays 1.5 px at any size.
 */
export function Sparkline({
  values,
  tone = 'accent',
  area = true,
  className,
  label,
}: {
  values: number[];
  tone?: 'accent' | 'up' | 'down' | 'muted';
  area?: boolean;
  className?: string;
  /** A text alternative. Without one the line is treated as decoration. */
  label?: string;
}) {
  const gradientId = useId();
  if (values.length < 2) return null;
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const span = hi - lo || 1;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * 100, 96 - ((v - lo) / span) * 88] as const);
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`).join('');
  const color = { accent: 'var(--color-accent)', up: 'var(--color-up)', down: 'var(--color-down)', muted: 'var(--color-ink-muted)' }[tone];
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className={cx('block', className)}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {area && (
        <>
          <defs>
            <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor={color} stopOpacity={0.28} />
              <stop offset="1" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <path d={`${line}L100,100L0,100Z`} fill={`url(#${gradientId})`} />
        </>
      )}
      <path d={line} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
