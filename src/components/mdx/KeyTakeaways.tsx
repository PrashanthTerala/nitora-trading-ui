import type { ReactNode } from 'react';
import { ListChecks } from 'lucide-react';
import { t } from '@/i18n';

/**
 * Wrap a markdown bullet list. Renders as the lesson's summary card, each point numbered in a
 * chip (see .takeaways in index.css), so the list reads as a short checklist to remember.
 */
export function KeyTakeaways({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <section id="key-takeaways" data-toc="2" data-toc-label={title ?? t('mdx.takeaways')} className="not-prose my-10 overflow-hidden rounded-card border border-line bg-surface-1 shadow-1">
      <h3 className="flex items-center gap-2.5 border-b border-line-subtle bg-surface-2 px-5 py-3 font-display text-h3 font-semibold text-ink">
        <ListChecks size={18} strokeWidth={1.75} className="text-accent" aria-hidden /> {title ?? t('mdx.takeaways')}
      </h3>
      <div className="takeaways md px-5 py-4 text-body leading-relaxed text-ink">{children}</div>
    </section>
  );
}
