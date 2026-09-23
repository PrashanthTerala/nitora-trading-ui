import type { ButtonHTMLAttributes } from 'react';
import { variants, type VariantProps } from './cx';

/**
 * Buttons. For a link that should look like a button, apply `buttonClass()` to the Link
 * rather than nesting a button inside an anchor.
 *
 * Every filled variant sets its own label colour (on-accent, on-up, on-down); those pairs are
 * checked to 4.5:1 in both themes by tools/lint-tokens.mjs.
 */
const table = {
  variant: {
    primary: 'bg-accent text-on-accent shadow-1 hover:bg-accent-hover',
    secondary: 'border border-line-strong bg-surface-1 text-ink hover:bg-surface-2',
    ghost: 'text-ink-soft hover:bg-surface-2 hover:text-ink',
    up: 'bg-up text-on-up shadow-1 hover:brightness-110',
    down: 'bg-down text-on-down shadow-1 hover:brightness-110',
  },
  size: {
    sm: 'h-8 gap-1.5 px-3 text-body-sm',
    md: 'h-10 gap-2 px-4 text-body-sm',
    lg: 'h-12 gap-2 px-5 text-body',
  },
};

export const buttonClass = variants(
  'inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-control font-semibold transition-[background-color,border-color,color,transform,filter] duration-(--duration-fast) ease-standard active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40',
  table,
  { variant: 'primary', size: 'md' },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof table>;

export function Button({ variant, size, className, type = 'button', ...rest }: ButtonProps) {
  return <button type={type} className={buttonClass({ variant, size }, className)} {...rest} />;
}
