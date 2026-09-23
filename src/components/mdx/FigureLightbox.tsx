import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { Dialog, DialogClose, DialogContent } from '@/components/ui/Dialog';
import { t } from '@/i18n';

/**
 * A figure, full screen. Its own module, loaded the first time any figure is expanded, so the
 * dialog primitive is not part of every page that merely shows a figure (the home page does).
 */
export default function FigureLightbox({
  open,
  onOpenChange,
  title,
  caption,
  toolbar,
  children,
  closeClass,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  caption?: ReactNode;
  toolbar?: ReactNode;
  children: ReactNode;
  closeClass: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={title} className="top-[4vh] w-[min(72rem,calc(100vw-2rem))]">
        <DialogClose className={`${closeClass} absolute right-3 top-3`} aria-label={t('common.close')}>
          <X size={16} strokeWidth={1.75} aria-hidden />
        </DialogClose>
        <div className="max-h-[80vh] overflow-y-auto px-5 pb-5 pt-3">
          {toolbar && <div className="mb-3 flex justify-end">{toolbar}</div>}
          {children}
          {caption && <p className="mt-4 text-body-sm leading-relaxed text-ink-soft">{caption}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
