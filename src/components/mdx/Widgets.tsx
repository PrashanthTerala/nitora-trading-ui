/**
 * Text helpers usable inside lessons: a call to practise, a two-column comparison and stats.
 * The glossary link is in Term.tsx; the interactive calculators are in Calculators.tsx.
 */
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, FlaskConical } from 'lucide-react';
import { buttonClass } from '@/components/ui/Button';
import { t } from '@/i18n';

/** Call to action into the simulator, trainer or journal; the default title names where it goes. */
export function TryIt({ to = '/simulator', title, children }: { to?: string; title?: string; children: ReactNode }) {
  return (
    <div className="not-prose my-8 flex flex-col gap-4 rounded-card border border-line bg-surface-1 p-5 shadow-1 sm:flex-row sm:items-center">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-accent-soft text-accent" aria-hidden>
        <FlaskConical size={18} strokeWidth={1.75} />
      </span>
      <div className="flex-1">
        <p className="font-semibold text-ink">{title ?? t(to.startsWith('/trainer') ? 'mdx.tryItTrainer' : to.startsWith('/journal') ? 'mdx.tryItJournal' : 'mdx.tryIt')}</p>
        <div className="md mt-1 text-body-sm leading-relaxed text-ink-soft">{children}</div>
      </div>
      <Link to={to} className={buttonClass({ size: 'md' })}>
        {t('mdx.tryItOpen')} <ArrowRight size={16} strokeWidth={1.5} aria-hidden />
      </Link>
    </div>
  );
}

/** Two-column comparison. <Compare left="Trader" right="Investor"> two lists </Compare> */
export function Compare({ left, right, children }: { left: string; right: string; children: ReactNode }) {
  return (
    <div className="not-prose compare md my-7 grid gap-x-6 gap-y-3 rounded-card border border-line bg-surface-1 p-5 sm:grid-cols-2">
      <div className="compare-heads contents">
        <div className="border-b border-line-subtle pb-2 text-caption font-semibold uppercase tracking-[0.08em] text-accent">{left}</div>
        <div className="border-b border-line-subtle pb-2 text-caption font-semibold uppercase tracking-[0.08em] text-accent">{right}</div>
      </div>
      {children}
    </div>
  );
}

/** A big stat with a label. */
export function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-panel border border-line bg-surface-1 px-4 py-3">
      <div className="font-mono text-mono-lg font-semibold text-ink tabular-nums">{value}</div>
      <div className="mt-1 text-caption text-ink-muted">{label}</div>
    </div>
  );
}

export function StatRow({ children }: { children: ReactNode }) {
  return <div className="not-prose my-7 grid grid-cols-2 gap-3 md:grid-cols-4">{children}</div>;
}
