import { useId, useRef, type KeyboardEvent } from 'react';
import { m } from 'motion/react';
import { cx } from './cx';

export interface TabItem<T extends string> {
  value: T;
  label: string;
}

/**
 * Tabs for switching between whole panels (tracks, drills). The panel they control carries
 * `panelId`; arrow keys move between tabs, as the ARIA tabs pattern specifies.
 */
export function Tabs<T extends string>({
  value,
  onChange,
  tabs,
  label,
  panelId,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  tabs: TabItem<T>[];
  label: string;
  panelId: string;
  className?: string;
}) {
  const id = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const index = Math.max(0, tabs.findIndex((tb) => tb.value === value));

  const onKeyDown = (e: KeyboardEvent) => {
    const next = e.key === 'ArrowRight' ? (index + 1) % tabs.length : e.key === 'ArrowLeft' ? (index - 1 + tabs.length) % tabs.length : -1;
    if (next < 0) return;
    e.preventDefault();
    onChange(tabs[next].value);
    refs.current[next]?.focus();
  };

  return (
    <div role="tablist" aria-label={label} onKeyDown={onKeyDown} className={cx('flex gap-1 border-b border-line', className)}>
      {tabs.map((tb, i) => {
        const active = i === index;
        return (
          <button
            key={tb.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`${id}-${tb.value}`}
            aria-selected={active}
            aria-controls={panelId}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(tb.value)}
            className={cx('relative px-3 pb-2.5 pt-1 text-body-sm font-semibold transition-colors duration-(--duration-fast)', active ? 'text-ink' : 'text-ink-soft hover:text-ink')}
          >
            {tb.label}
            {active && <m.span layoutId={`tab-${id}`} className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent" />}
          </button>
        );
      })}
    </div>
  );
}
