import { useMemo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Brain, CandlestickChart, Clock, NotebookPen, type LucideIcon } from 'lucide-react';
import { findModule, ALL_LESSONS } from '@/content/curriculum';
import { FIGURES } from '@/content/figures';
import { useProgress, nextLesson, lessonKey } from '@/store/progress';
import { STORAGE_KEYS } from '@/lib/storageKeys';
import { CandleSvg } from '@/components/figures/CandleSvg';
import { ModuleCover } from '@/components/curriculum/ModuleCover';
import { cardClass } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Sparkline } from '@/components/ui/Sparkline';
import { cx } from '@/components/ui/cx';
import { t } from '@/i18n';
import type { EngineSnapshot } from './engineSnapshot';

function Room({
  to,
  icon: Icon,
  title,
  text,
  children,
  className,
  previewAtEnd = true,
}: {
  to: string;
  icon: LucideIcon;
  title: string;
  text: string;
  children: ReactNode;
  className?: string;
  /** Pin the preview to the card's bottom edge, so cards in a row line up. */
  previewAtEnd?: boolean;
}) {
  return (
    <Link to={to} className={cardClass({ interactive: 'yes', padding: 'none' }, cx('group flex flex-col overflow-hidden', className))}>
      <div className="p-5 pb-4">
        <span className="mb-4 flex h-9 w-9 items-center justify-center rounded-control border border-line bg-surface-2 text-accent">
          <Icon size={18} strokeWidth={1.5} aria-hidden />
        </span>
        <h3 className="font-display text-h3 font-semibold text-ink">{title}</h3>
        <p className="mt-1.5 text-body-sm text-ink-soft">{text}</p>
      </div>
      <div className={cx('px-5 pb-5', previewAtEnd && 'mt-auto')}>{children}</div>
    </Link>
  );
}

function LearnPreview() {
  const completed = useProgress((s) => s.completed);
  const next = nextLesson(completed);
  if (!next) return <p className="rounded-panel border border-line-subtle bg-surface-2 p-4 text-body-sm text-ink-soft">{t('home.learnDone')}</p>;
  const mod = findModule(next.moduleId);
  const after = ALL_LESSONS.slice(ALL_LESSONS.indexOf(next) + 1)
    .filter((l) => !completed[lessonKey(l.moduleId, l.id)])
    .slice(0, 3);
  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-panel border border-line bg-surface-2">
        {mod && <ModuleCover module={mod} variant="thumb" className="h-24" />}
        <div className="p-4">
          <p className="text-caption font-semibold uppercase tracking-[0.08em] text-accent">{t('home.learnNext')}</p>
          <p className="mt-1 font-semibold text-ink">{next.title}</p>
          <p className="mt-1 line-clamp-2 text-body-sm text-ink-soft">{next.summary}</p>
          <p className="mt-3 flex items-center gap-1.5 text-caption text-ink-muted">
            <Clock size={12} strokeWidth={1.5} aria-hidden /> {t('common.minutes', { count: next.minutes })} · {t('common.module', { number: next.moduleNumber })}
          </p>
        </div>
      </div>
      <ol className="space-y-1.5 max-lg:hidden">
        {after.map((l) => (
          <li key={l.path} className="flex items-center gap-3 rounded-control px-2 py-1.5 text-body-sm text-ink-soft">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-line-strong" aria-hidden />
            <span className="min-w-0 flex-1 truncate">{l.title}</span>
            <span className="font-mono text-mono-sm text-ink-muted">{t('common.minutes', { count: l.minutes })}</span>
          </li>
        ))}
      </ol>
      <span className="flex items-center gap-1 text-body-sm font-semibold text-accent">
        {t('home.open')} <ArrowRight size={14} strokeWidth={1.5} className="transition-transform duration-(--duration-fast) group-hover:translate-x-0.5" aria-hidden />
      </span>
    </div>
  );
}

function SimPreview({ spark }: { spark: EngineSnapshot['spark'] | null }) {
  if (!spark) return <Skeleton className="aspect-[720/170]" />;
  return (
    <figure>
      <div className="overflow-hidden rounded-panel border border-line-subtle bg-bg px-1 pt-1">
        <CandleSvg bars={spark.bars} width={720} height={170} axis={false} />
      </div>
      <figcaption className="mt-2 flex items-center justify-between font-mono text-mono-sm text-ink-muted">
        <span>{t('home.simCaption', { symbol: spark.symbol, count: spark.bars.length })}</span>
        <span>{t('common.synthetic')}</span>
      </figcaption>
    </figure>
  );
}

// The card shows the hammer; the choices are the titles of real figures in the pattern library.
const trainerCard = FIGURES['hammer'];
const trainerChoices = ['hammer', 'shooting-star', 'doji', 'bullish-engulfing'].map((id) => FIGURES[id]?.title ?? id);

function TrainerPreview() {
  return (
    <div className="rounded-panel border border-line-subtle bg-bg p-3">
      <p className="mb-2 text-caption font-semibold uppercase tracking-[0.08em] text-ink-muted">{t('home.trainerPrompt')}</p>
      <CandleSvg bars={trainerCard.bars} width={320} height={120} axis={false} fadeBefore={trainerCard.fadeBefore} />
      <div className="mt-3 grid grid-cols-2 gap-2" aria-hidden>
        {trainerChoices.map((o) => (
          <span key={o} className="truncate rounded-control border border-line bg-surface-1 px-2 py-1.5 text-center text-caption text-ink-soft">
            {o}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * The journal's equity after each closed trade, read straight from the simulator's saved
 * session. Importing the simulator store here would rehydrate it -- and possibly reconnect a
 * live feed -- just to draw a line, so the saved JSON is read directly instead.
 */
function readClosedTradeEquity(): number[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.sim);
    if (!raw) return null;
    const account = (JSON.parse(raw) as { state?: { account?: { trades?: { pnl: number }[]; settings?: { startingCash?: number } } } }).state?.account;
    const trades = account?.trades ?? [];
    if (!trades.length) return null;
    let equity = account?.settings?.startingCash ?? 100000;
    return [equity, ...trades.map((tr) => (equity += tr.pnl))];
  } catch {
    return null;
  }
}

function JournalPreview() {
  const curve = useMemo(readClosedTradeEquity, []);
  if (!curve) {
    return (
      <div className="relative flex h-32 items-end overflow-hidden rounded-panel border border-dashed border-line bg-bg p-4">
        <p className="relative text-body-sm text-ink-soft">{t('home.journalEmpty')}</p>
      </div>
    );
  }
  const up = curve[curve.length - 1] >= curve[0];
  return (
    <figure>
      <div className="h-32 overflow-hidden rounded-panel border border-line-subtle bg-bg p-2">
        <Sparkline values={curve} tone={up ? 'up' : 'down'} className="h-full w-full" />
      </div>
      <figcaption className="mt-2 text-caption text-ink-muted">{t('home.journalCurve', { count: curve.length - 1 })}</figcaption>
    </figure>
  );
}

export function Rooms({ snapshot }: { snapshot: EngineSnapshot | null }) {
  return (
    <section className="mx-auto max-w-[1200px] px-4 py-section sm:px-6">
      <div className="mb-10 max-w-2xl">
        <h2 className="font-display text-display font-bold text-ink">{t('home.roomsTitle')}</h2>
        <p className="mt-4 text-body-lg text-ink-soft">{t('home.roomsLead')}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 lg:grid-rows-[auto_auto]">
        <Room to="/learn" icon={BookOpen} title={t('home.learnTitle')} text={t('home.learnText')} className="lg:row-span-2" previewAtEnd={false}>
          <LearnPreview />
        </Room>
        <Room to="/simulator" icon={CandlestickChart} title={t('home.simTitle')} text={t('home.simText')} className="lg:col-span-2">
          <SimPreview spark={snapshot?.spark ?? null} />
        </Room>
        <Room to="/trainer" icon={Brain} title={t('home.trainerTitle')} text={t('home.trainerText')}>
          <TrainerPreview />
        </Room>
        <Room to="/journal" icon={NotebookPen} title={t('home.journalTitle')} text={t('home.journalText')}>
          <JournalPreview />
        </Room>
      </div>
    </section>
  );
}
