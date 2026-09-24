import { cx } from './cx';

/**
 * The text-field look, for an <input> or <select> that needs no wrapper: a control-strength
 * border (3:1 against the surface, as a control boundary must be) that turns accent on focus,
 * with the focus ring from the base layer. Numbers are tabular so they do not shift as they
 * change. Sizes add height and padding; anything else goes in `extra`.
 */
export function inputClass(extra?: string, size: 'sm' | 'md' = 'md') {
  return cx(
    'rounded-control border border-line-strong bg-surface-1 text-ink tabular-nums transition-colors duration-(--duration-fast) placeholder:text-ink-muted focus-visible:border-accent',
    size === 'sm' ? 'h-8 px-2.5 text-body-sm' : 'h-10 px-3 text-body-sm',
    extra,
  );
}
