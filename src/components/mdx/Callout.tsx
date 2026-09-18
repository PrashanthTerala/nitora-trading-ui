import type { ReactNode } from 'react';
import { Lightbulb, AlertTriangle, Info, BookOpen, Calculator, Baby, Skull } from 'lucide-react';

type Kind = 'tip' | 'warning' | 'info' | 'story' | 'math' | 'eli5' | 'danger';

const STYLES: Record<Kind, { icon: ReactNode; cls: string; label: string }> = {
  tip: { icon: <Lightbulb size={18} />, cls: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300', label: 'Tip' },
  warning: { icon: <AlertTriangle size={18} />, cls: 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300', label: 'Watch out' },
  danger: { icon: <Skull size={18} />, cls: 'border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300', label: 'Account killer' },
  info: { icon: <Info size={18} />, cls: 'border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300', label: 'Good to know' },
  story: { icon: <BookOpen size={18} />, cls: 'border-violet-500/40 bg-violet-500/10 text-violet-700 dark:text-violet-300', label: 'Story' },
  math: { icon: <Calculator size={18} />, cls: 'border-slate-500/40 bg-slate-500/10 text-slate-700 dark:text-slate-300', label: 'The maths' },
  eli5: { icon: <Baby size={18} />, cls: 'border-pink-500/40 bg-pink-500/10 text-pink-700 dark:text-pink-300', label: 'Explain it like I am five' },
};

export function Callout({ type = 'info', title, children }: { type?: Kind; title?: string; children: ReactNode }) {
  const s = STYLES[type] ?? STYLES.info;
  return (
    <aside className={`not-prose my-6 rounded-xl border px-4 py-3 ${s.cls}`}>
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
        {s.icon}
        <span>{title ?? s.label}</span>
      </div>
      <div className="callout-body mt-2 text-[15px] leading-relaxed text-ink">{children}</div>
    </aside>
  );
}
