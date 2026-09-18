import type { ReactNode } from 'react';
import { CheckCircle2 } from 'lucide-react';

/** Wrap a markdown bullet list. Renders as the lesson's summary card. */
export function KeyTakeaways({ children, title = 'Key takeaways' }: { children: ReactNode; title?: string }) {
  return (
    <section className="not-prose my-8 rounded-2xl border border-accent/30 bg-accent/5 p-5">
      <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-accent">
        <CheckCircle2 size={18} /> {title}
      </h3>
      <div className="takeaways text-[15px] leading-relaxed text-ink">{children}</div>
    </section>
  );
}
