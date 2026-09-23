import { cx } from './cx';

/** An on/off switch with its label. A real `role="switch"`, so it announces as on or off. */
export function Switch({ checked, onChange, label, className }: { checked: boolean; onChange: (checked: boolean) => void; label: string; className?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cx('inline-flex items-center gap-2.5 rounded-control py-1 text-body-sm font-medium text-ink-soft hover:text-ink', className)}
    >
      <span className={cx('relative h-5 w-9 shrink-0 rounded-full border transition-colors duration-(--duration-fast)', checked ? 'border-accent bg-accent' : 'border-line-strong bg-surface-2')}>
        <span
          className={cx(
            'absolute top-0.5 h-3.5 w-3.5 rounded-full shadow-1 transition-transform duration-(--duration-fast) ease-standard',
            checked ? 'translate-x-[1.125rem] bg-on-accent' : 'translate-x-0.5 bg-ink-soft',
          )}
        />
      </span>
      {label}
    </button>
  );
}
