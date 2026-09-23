import type { ReactNode } from 'react';
import { AlertTriangle, Baby, BookOpen, Calculator, Info, Lightbulb, Skull, type LucideIcon } from 'lucide-react';
import { t, type MessageKey } from '@/i18n';

export type CalloutKind = 'tip' | 'warning' | 'info' | 'story' | 'math' | 'eli5' | 'danger';

/**
 * Each type is a quiet identity: an icon tile, a 3 px rule down the left, a soft tint and a
 * label, all from tokens. Only status colours are used (accent, info, warn, danger), never the
 * market up/down pair, so a callout is never read as a price move. The three plain types
 * (info, story, math) share the neutral tint and differ by icon and label.
 */
const KINDS: Record<CalloutKind, { icon: LucideIcon; label: MessageKey; box: string; tile: string; label_: string }> = {
  eli5: { icon: Baby, label: 'mdx.callout.eli5', box: 'border-accent bg-accent-soft', tile: 'text-accent', label_: 'text-accent' },
  tip: { icon: Lightbulb, label: 'mdx.callout.tip', box: 'border-info bg-info-soft', tile: 'text-info', label_: 'text-info' },
  warning: { icon: AlertTriangle, label: 'mdx.callout.warning', box: 'border-warn bg-warn-soft', tile: 'text-warn', label_: 'text-warn' },
  danger: { icon: Skull, label: 'mdx.callout.danger', box: 'border-danger bg-danger-soft', tile: 'text-danger', label_: 'text-danger' },
  info: { icon: Info, label: 'mdx.callout.info', box: 'border-line-strong bg-neutral-soft', tile: 'text-ink-soft', label_: 'text-ink' },
  story: { icon: BookOpen, label: 'mdx.callout.story', box: 'border-line-strong bg-neutral-soft', tile: 'text-ink-soft', label_: 'text-ink' },
  math: { icon: Calculator, label: 'mdx.callout.math', box: 'border-line-strong bg-neutral-soft', tile: 'text-ink-soft', label_: 'text-ink' },
};

export function Callout({ type = 'info', title, children }: { type?: CalloutKind; title?: string; children: ReactNode }) {
  const k = KINDS[type] ?? KINDS.info;
  const Icon = k.icon;
  return (
    <aside className={`not-prose my-7 flex gap-3.5 rounded-r-card border-l-[3px] py-4 pl-4 pr-5 sm:gap-4 ${k.box}`}>
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-surface-1 shadow-1 ${k.tile}`} aria-hidden>
        <Icon size={17} strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <p className={`pt-1.5 text-caption font-semibold uppercase tracking-[0.08em] ${k.label_}`}>{t(k.label)}</p>
        {/* An author's title is a sentence, so it reads as one rather than shouting in capitals. */}
        {title && <p className="mt-1 font-semibold leading-snug text-ink">{title}</p>}
        <div className="callout-body md mt-2 text-body leading-relaxed text-ink">{children}</div>
      </div>
    </aside>
  );
}
