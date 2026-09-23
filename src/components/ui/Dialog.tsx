import * as D from '@radix-ui/react-dialog';
import type { ReactNode } from 'react';
import { cx } from './cx';

/**
 * Modal dialog. Radix supplies what is easy to get wrong by hand: focus trapped inside and
 * returned on close, Escape, scroll lock, and the dialog role wired to its title.
 *
 * One of the few places glass is allowed: the scrim blurs what is behind it.
 */
export const Dialog = D.Root;
export const DialogTrigger = D.Trigger;
export const DialogClose = D.Close;

export function DialogContent({
  title,
  hideTitle = false,
  children,
  className,
}: {
  title: string;
  hideTitle?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <D.Portal>
      <D.Overlay className="anim-fade-in fixed inset-0 z-50 bg-overlay backdrop-blur-sm" />
      <D.Content
        aria-describedby={undefined}
        className={cx(
          'anim-dialog-in fixed left-1/2 top-[10vh] z-50 w-[min(40rem,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-dialog border border-line bg-surface-3 shadow-4 outline-none',
          className,
        )}
      >
        <D.Title className={hideTitle ? 'sr-only' : 'px-5 pt-5 font-display text-h3 font-semibold'}>{title}</D.Title>
        {children}
      </D.Content>
    </D.Portal>
  );
}
