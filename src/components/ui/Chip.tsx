import type { HTMLAttributes } from 'react';
import { variants, type VariantProps } from './cx';

/** Small labels. Each tinted tone is a pair checked to 4.5:1 (text on its own tint). */
const table = {
  tone: {
    neutral: 'border border-line bg-surface-1 text-ink-soft',
    accent: 'bg-accent-soft text-accent',
    up: 'bg-up-soft text-up',
    down: 'bg-down-soft text-down',
    warn: 'bg-warn-soft text-warn',
    info: 'bg-info-soft text-info',
    inverse: 'bg-ink text-ink-inverse',
  },
  size: {
    sm: 'h-5 gap-1 px-2 text-caption',
    md: 'h-6 gap-1.5 px-2.5 text-body-sm',
  },
};

export const chipClass = variants('inline-flex shrink-0 items-center rounded-full font-semibold whitespace-nowrap', table, { tone: 'neutral', size: 'sm' });

export function Chip({ tone, size, className, ...rest }: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof table>) {
  return <span className={chipClass({ tone, size }, className)} {...rest} />;
}
