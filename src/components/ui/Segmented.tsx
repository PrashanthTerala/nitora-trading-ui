import { useId, useRef, type KeyboardEvent } from 'react';
import { m } from 'motion/react';
import { cx } from './cx';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

/**
 * A segmented control: one choice from a few, all visible. It is a radio group, so arrow keys
 * move the choice and Tab moves past it, as a screen reader expects.
 */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: SegmentOption<T>[];
  label: string;
  className?: string;
}) {
  const id = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const index = Math.max(0, options.findIndex((o) => o.value === value));

  const onKeyDown = (e: KeyboardEvent) => {
    const last = options.length - 1;
    const next =
      e.key === 'ArrowRight' || e.key === 'ArrowDown' ? (index + 1) % options.length
      : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? (index - 1 + options.length) % options.length
      : e.key === 'Home' ? 0
      : e.key === 'End' ? last
      : -1;
    if (next < 0) return;
    e.preventDefault();
    onChange(options[next].value);
    refs.current[next]?.focus();
  };

  return (
    <div role="radiogroup" aria-label={label} onKeyDown={onKeyDown} className={cx('inline-flex max-w-full overflow-x-auto rounded-control border border-line bg-surface-2 p-0.5', className)}>
      {options.map((o, i) => {
        const active = i === index;
        return (
          <button
            key={o.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(o.value)}
            className={cx(
              'relative h-8 shrink-0 rounded-[8px] px-3 text-body-sm font-semibold transition-colors duration-(--duration-fast)',
              active ? 'text-ink' : 'text-ink-soft hover:text-ink',
            )}
          >
            {active && <m.span layoutId={`segment-${id}`} className="absolute inset-0 rounded-[8px] border border-line bg-surface-1 shadow-1" transition={{ type: 'spring', stiffness: 520, damping: 42 }} />}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
