import * as D from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

/**
 * A bottom sheet for small screens: a modal dialog that rises from the bottom edge, with the
 * same focus trap and Escape handling as Dialog. Glass is allowed here, as on modals.
 */
export const Sheet = D.Root;
export const SheetTrigger = D.Trigger;
export const SheetClose = D.Close;

export function SheetContent({ title, closeLabel, children }: { title: string; closeLabel: string; children: ReactNode }) {
  return (
    <D.Portal>
      <D.Overlay className="anim-fade-in fixed inset-0 z-50 bg-overlay backdrop-blur-sm" />
      <D.Content
        aria-describedby={undefined}
        className="anim-sheet-in fixed inset-x-0 bottom-0 z-50 rounded-t-dialog border-t border-line bg-surface-3/85 px-4 pt-3 shadow-4 outline-none backdrop-blur-md pb-[max(1.25rem,env(safe-area-inset-bottom))]"
      >
        <div aria-hidden className="mx-auto mb-3 h-1 w-10 rounded-full bg-line-strong" />
        <div className="mb-2 flex items-center justify-between">
          <D.Title className="font-display text-h3 font-semibold">{title}</D.Title>
          <D.Close className="rounded-control p-2 text-ink-soft hover:bg-surface-2 hover:text-ink" aria-label={closeLabel}>
            <X size={18} strokeWidth={1.5} />
          </D.Close>
        </div>
        {children}
      </D.Content>
    </D.Portal>
  );
}
