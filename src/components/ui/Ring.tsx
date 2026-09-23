import type { ReactNode } from 'react';
import { cx } from './cx';

/**
 * A circular progress ring. It is a real progressbar for assistive technology, with its
 * value and a label, not a picture of one.
 */
export function Ring({
  value,
  size = 28,
  stroke = 3,
  label,
  className,
  children,
  tone = 'accent',
}: {
  /** 0..1 */
  value: number;
  size?: number;
  stroke?: number;
  label: string;
  className?: string;
  children?: ReactNode;
  tone?: 'accent' | 'up';
}) {
  const v = Math.min(1, Math.max(0, value));
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const pct = Math.round(v * 100);
  return (
    <span
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      className={cx('relative inline-flex shrink-0 items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-line)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tone === 'up' ? 'var(--color-up)' : 'var(--color-accent)'}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - v)}
          className="transition-[stroke-dashoffset] duration-(--duration-slow) ease-standard"
        />
      </svg>
      {children && <span className="absolute inset-0 flex items-center justify-center">{children}</span>}
    </span>
  );
}
