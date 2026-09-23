import { AnimatePresence, m } from 'motion/react';
import { CheckCircle2, Info, X } from 'lucide-react';
import { create } from 'zustand';
import { t } from '@/i18n';

/**
 * A tiny toaster: short confirmations such as "Lesson marked complete". No library -- it is a
 * list in a store and one live region.
 *
 *   toast({ title: t('toast.lessonComplete'), description: lesson.title, tone: 'up' })
 *
 * Bottom-right on desktop, top-centre on mobile, where the bottom belongs to the tab bar.
 * Announced politely: a screen reader finishes its sentence first.
 */
export interface ToastItem {
  id: number;
  title: string;
  description?: string;
  tone?: 'neutral' | 'up';
}

interface ToastState {
  items: ToastItem[];
  push: (item: ToastItem) => void;
  dismiss: (id: number) => void;
}

const useToasts = create<ToastState>((set) => ({
  items: [],
  push: (item) => set((s) => ({ items: [...s.items.slice(-2), item] })),
  dismiss: (id) => set((s) => ({ items: s.items.filter((x) => x.id !== id) })),
}));

let nextId = 1;
const LIFETIME_MS = 4000;

export function toast(item: Omit<ToastItem, 'id'>): void {
  const id = nextId++;
  useToasts.getState().push({ ...item, id });
  window.setTimeout(() => useToasts.getState().dismiss(id), LIFETIME_MS);
}

export function Toaster() {
  const items = useToasts((s) => s.items);
  const dismiss = useToasts((s) => s.dismiss);
  return (
    <section aria-label={t('toast.region')} className="pointer-events-none fixed inset-x-0 top-[calc(var(--spacing-header)+0.5rem)] z-[60] px-4 md:inset-x-auto md:top-auto md:right-6 md:bottom-6 md:px-0">
      <div role="status" aria-live="polite" className="flex flex-col items-center gap-2 md:items-end">
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <m.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
              className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-card border border-line bg-surface-3 p-3 pr-2 shadow-3"
            >
              {item.tone === 'up' ? (
                <CheckCircle2 size={18} strokeWidth={1.5} className="mt-0.5 shrink-0 text-up" aria-hidden />
              ) : (
                <Info size={18} strokeWidth={1.5} className="mt-0.5 shrink-0 text-info" aria-hidden />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-body-sm font-semibold text-ink">{item.title}</p>
                {item.description && <p className="truncate text-body-sm text-ink-soft">{item.description}</p>}
              </div>
              <button type="button" onClick={() => dismiss(item.id)} aria-label={t('toast.dismiss')} className="rounded-control p-1 text-ink-muted hover:bg-surface-2 hover:text-ink">
                <X size={15} strokeWidth={1.5} />
              </button>
            </m.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}
