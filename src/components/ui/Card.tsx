import type { HTMLAttributes } from 'react';
import { variants } from './cx';

/**
 * The card surface. `interactive` lifts it 2 px and brightens its border on hover -- for cards
 * that are a link or open something, never for static ones.
 */
export const cardClass = variants(
  'rounded-card border border-line bg-surface-1 shadow-1',
  {
    interactive: {
      yes: 'transition-[transform,border-color,box-shadow] duration-(--duration-base) ease-standard hover:-translate-y-0.5 hover:border-line-strong hover:shadow-2',
      no: '',
    },
    padding: { none: '', sm: 'p-4', md: 'p-5', lg: 'p-6' },
  },
  { interactive: 'no', padding: 'md' },
);

export function Card({
  interactive = false,
  padding,
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { interactive?: boolean; padding?: 'none' | 'sm' | 'md' | 'lg' }) {
  return <div className={cardClass({ interactive: interactive ? 'yes' : 'no', padding }, className)} {...rest} />;
}
