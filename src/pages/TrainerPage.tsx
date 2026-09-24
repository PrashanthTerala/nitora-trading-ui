/**
 * Two drills, played in sessions of ten:
 *  1. Name the pattern — shows a preset figure without its label and asks which it is.
 *  2. Next candles — shows a synthetic chart and asks whether price closes higher or
 *     lower over the following bars. Deliberately humbling: it teaches that a good
 *     read is an edge, not a certainty.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { m } from 'motion/react';
import { Check, X, ArrowRight, TrendingUp, TrendingDown, Trophy, Copy, RotateCcw, ArrowLeft, BookOpen } from 'lucide-react';
import { CandleSvg } from '@/components/figures/CandleSvg';
import { FigureFrame } from '@/components/mdx/FigureFrame';
import { CANDLE_PATTERNS } from '@/content/figures/candlePatterns';
import { CHART_PATTERNS } from '@/content/figures/chartPatterns';
import { ALL_LESSONS, findModule } from '@/content/curriculum';
import { Market } from '@/engine/market/feed';
import { SYMBOLS } from '@/engine/market/symbols';
import { aggregate } from '@/engine/market/generator';
import type { OHLC } from '@/engine/market/types';
import { useProgress } from '@/store/progress';
import { Rng, shuffled } from '@/lib/rng';
import { usePageMeta } from '@/lib/pageMeta';
import { ModuleGlyph } from '@/components/curriculum/ModuleGlyph';
import { Button } from '@/components/ui/Button';
import { Kbd } from '@/components/ui/Kbd';
import { toast } from '@/components/ui/Toast';
import { cx } from '@/components/ui/cx';
import contentIndex from 'virtual:content-index';
import { t } from '@/i18n';

/** Patterns eligible for the naming quiz, grouped so distractors are plausible. */
const QUIZ_POOL: { name: string; label: string; group: string }[] = [
  { name: 'hammer', label: 'Hammer', group: 'single' },
  { name: 'hanging-man', label: 'Hanging Man', group: 'single' },
  { name: 'inverted-hammer', label: 'Inverted Hammer', group: 'single' },
  { name: 'shooting-star', label: 'Shooting Star', group: 'single' },
  { name: 'doji', label: 'Doji', group: 'single' },
  { name: 'dragonfly-doji', label: 'Dragonfly Doji', group: 'single' },
  { name: 'gravestone-doji', label: 'Gravestone Doji', group: 'single' },
  { name: 'long-legged-doji', label: 'Long-legged Doji', group: 'single' },
  { name: 'spinning-top', label: 'Spinning Top', group: 'single' },
  { name: 'high-wave', label: 'High Wave', group: 'single' },
  { name: 'marubozu-bullish', label: 'Bullish Marubozu', group: 'single' },
  { name: 'marubozu-bearish', label: 'Bearish Marubozu', group: 'single' },
  { name: 'bullish-engulfing', label: 'Bullish Engulfing', group: 'double' },
  { name: 'bearish-engulfing', label: 'Bearish Engulfing', group: 'double' },
  { name: 'bullish-harami', label: 'Bullish Harami', group: 'double' },
  { name: 'bearish-harami', label: 'Bearish Harami', group: 'double' },
  { name: 'harami-cross', label: 'Harami Cross', group: 'double' },
  { name: 'piercing-line', label: 'Piercing Line', group: 'double' },
  { name: 'dark-cloud-cover', label: 'Dark Cloud Cover', group: 'double' },
  { name: 'tweezer-bottom', label: 'Tweezer Bottom', group: 'double' },
  { name: 'tweezer-top', label: 'Tweezer Top', group: 'double' },
  { name: 'morning-star', label: 'Morning Star', group: 'triple' },
  { name: 'evening-star', label: 'Evening Star', group: 'triple' },
  { name: 'three-white-soldiers', label: 'Three White Soldiers', group: 'triple' },
  { name: 'three-black-crows', label: 'Three Black Crows', group: 'triple' },
  { name: 'three-inside-up', label: 'Three Inside Up', group: 'triple' },
  { name: 'three-inside-down', label: 'Three Inside Down', group: 'triple' },
  { name: 'abandoned-baby-bullish', label: 'Bullish Abandoned Baby', group: 'triple' },
  { name: 'rising-three-methods', label: 'Rising Three Methods', group: 'continuation' },
  { name: 'falling-three-methods', label: 'Falling Three Methods', group: 'continuation' },
  { name: 'upside-tasuki-gap', label: 'Upside Tasuki Gap', group: 'continuation' },
  { name: 'on-neck', label: 'On-Neck Line', group: 'continuation' },
  { name: 'head-and-shoulders', label: 'Head and Shoulders', group: 'chart' },
  { name: 'inverse-head-and-shoulders', label: 'Inverse Head and Shoulders', group: 'chart' },
  { name: 'double-top', label: 'Double Top', group: 'chart' },
  { name: 'double-bottom', label: 'Double Bottom', group: 'chart' },
  { name: 'ascending-triangle', label: 'Ascending Triangle', group: 'chart' },
  { name: 'descending-triangle', label: 'Descending Triangle', group: 'chart' },
  { name: 'symmetrical-triangle', label: 'Symmetrical Triangle', group: 'chart' },
  { name: 'bull-flag', label: 'Bull Flag', group: 'chart' },
  { name: 'bear-flag', label: 'Bear Flag', group: 'chart' },
  { name: 'rising-wedge', label: 'Rising Wedge', group: 'chart' },
  { name: 'falling-wedge', label: 'Falling Wedge', group: 'chart' },
  { name: 'cup-and-handle', label: 'Cup and Handle', group: 'chart' },
];

const ALL_FIGS = { ...CANDLE_PATTERNS, ...CHART_PATTERNS };
const ROUNDS = 10;
const HIDDEN = 5;
const SHOWN = 45;
/** The lesson behind the Next-candles drill: what an edge is, and what it is not. */
const EDGE_LESSON = '/learn/m09-strategies/02-what-is-an-edge';

type Drill = 'name' | 'next';
const DRILLS: { id: Drill; module: string; best: string }[] = [
  { id: 'name', module: 'm02-candlestick-patterns', best: 'name-streak' },
  { id: 'next', module: 'm01-reading-price', best: 'next-candle' },
];

/** A fresh, opaque seed per round. Keeps each question stable once it is on screen. */
function newSeed() {
  return Math.random().toString(36).slice(2, 10);
}

/** The first lesson that shows a figure, if any. */
function lessonFor(path: string | undefined) {
  return path ? (ALL_LESSONS.find((l) => l.path === path) ?? null) : null;
}

function fmtTime(ms: number) {
  const s = Math.round(ms / 1000);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`;
}

export function TrainerPage() {
  usePageMeta({ title: t('nav.trainer'), description: t('meta.trainer') });
  const [drill, setDrill] = useState<Drill | null>(null);
  const [run, setRun] = useState(0);

  return (
    <div className={cx('mx-auto max-w-5xl', drill ? 'space-y-5' : 'space-y-8')}>
      {/* In a drill the header steps back, so the figure, the answers and the feedback fit one screen. */}
      <header className={drill ? 'flex items-center justify-between gap-4' : undefined}>
        <h1 className={cx('font-display font-semibold tracking-tight', drill ? 'text-h3' : 'text-h1')}>{t('trainer.title')}</h1>
        {drill ? (
          <Button variant="ghost" size="sm" onClick={() => setDrill(null)}>
            <X size={15} aria-hidden /> {t('trainer.quit')}
          </Button>
        ) : (
          <p className="mt-2 max-w-2xl text-body-lg text-ink-soft">{t('trainer.lead')}</p>
        )}
      </header>
      {drill ? (
        <Session
          key={run}
          drill={drill}
          onExit={() => setDrill(null)}
          onAgain={() => setRun((r) => r + 1)}
        />
      ) : (
        <Picker onPick={setDrill} />
      )}
    </div>
  );
}

function Picker({ onPick }: { onPick: (d: Drill) => void }) {
  const trainerBest = useProgress((s) => s.trainerBest);
  return (
    <section aria-labelledby="trainer-pick">
      <h2 id="trainer-pick" className="sr-only">
        {t('trainer.pick')}
      </h2>
      <div className="grid gap-4 md:grid-cols-2">
        {DRILLS.map((d) => {
          const mod = findModule(d.module);
          const best = trainerBest[d.best];
          return (
            <m.button
              key={d.id}
              type="button"
              onClick={() => onPick(d.id)}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.99 }}
              className="group flex flex-col items-start gap-4 rounded-feature border border-line bg-surface-1 p-6 text-left shadow-1 transition-[border-color,box-shadow] duration-(--duration-fast) hover:border-accent hover:shadow-2 md:p-8"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-card bg-accent-soft text-accent">
                {mod && <ModuleGlyph module={mod} className="h-8 w-8" />}
              </span>
              <span>
                <span className="block font-display text-h2 font-semibold">{t(`trainer.${d.id}.title`)}</span>
                <span className="mt-2 block text-body text-ink-soft">{t(`trainer.${d.id}.blurb`)}</span>
              </span>
              <span className="mt-auto flex w-full items-center justify-between gap-3 pt-2">
                <span className="flex items-center gap-1.5 text-body-sm text-ink-soft">
                  <Trophy size={15} aria-hidden className={best ? 'text-warn' : undefined} />
                  {best ? t(`trainer.${d.id}.best`, { n: best }) : t('trainer.notPlayed')}
                </span>
                <span className="inline-flex items-center gap-1.5 font-semibold text-accent">
                  {t('trainer.rounds', { n: ROUNDS })}
                  <ArrowRight size={16} aria-hidden className="transition-transform duration-(--duration-fast) group-hover:translate-x-0.5" />
                </span>
              </span>
            </m.button>
          );
        })}
      </div>
    </section>
  );
}

interface RoundResult {
  ok: boolean;
  ms: number;
}

/** Ten rounds of one drill, a stats rail beside them, and the results at the end. */
function Session({ drill, onExit, onAgain }: { drill: Drill; onExit: () => void; onAgain: () => void }) {
  const setTrainerBest = useProgress((s) => s.setTrainerBest);
  const bestBefore = useRef(useProgress.getState().trainerBest[DRILLS.find((d) => d.id === drill)!.best] ?? 0);
  const [round, setRound] = useState(0);
  const [seed, setSeed] = useState(newSeed);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [finished, setFinished] = useState(false);
  const shownAt = useRef(performance.now());
  const startedAt = useRef(Date.now());
  const [now, setNow] = useState(Date.now());
  const [endedAt, setEndedAt] = useState<number | null>(null);

  useEffect(() => {
    if (endedAt) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [endedAt]);

  const answered = results.length > round;
  const correct = results.filter((r) => r.ok).length;

  const record = useCallback(
    (ok: boolean) => {
      if (results.length > round) return;
      const next = [...results, { ok, ms: performance.now() - shownAt.current }];
      setResults(next);
      const st = ok ? streak + 1 : 0;
      setStreak(st);
      setBestStreak((b) => Math.max(b, st));
      if (drill === 'name' && ok) setTrainerBest('name-streak', st);
      if (drill === 'next') setTrainerBest('next-candle', next.filter((r) => r.ok).length);
      if (next.length === ROUNDS) setEndedAt(Date.now());
    },
    [results, round, streak, drill, setTrainerBest],
  );

  const advance = useCallback(() => {
    if (results.length <= round) return;
    if (round + 1 >= ROUNDS) {
      setFinished(true);
      return;
    }
    setRound((r) => r + 1);
    setSeed(newSeed());
    shownAt.current = performance.now();
  }, [results.length, round]);

  const elapsed = (endedAt ?? now) - startedAt.current;

  if (finished) {
    const newBest = drill === 'name' ? bestStreak > bestBefore.current : correct > bestBefore.current;
    return <Results drill={drill} results={results} bestStreak={bestStreak} elapsed={elapsed} newBest={newBest} onAgain={onAgain} onExit={onExit} />;
  }

  const last = round + 1 === ROUNDS;
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_15rem]">
      <div className="flex min-w-0 flex-col gap-4">
        {drill === 'name' ? (
          <NameRound key={seed} seed={seed} answered={answered} onAnswer={record} onNext={advance} last={last} />
        ) : (
          <NextRound key={seed} seed={seed} answered={answered} onAnswer={record} onNext={advance} last={last} />
        )}
      </div>
      <aside aria-label={t('trainer.stats.label')} className="order-first lg:order-none">
        <div className="rounded-card border border-line bg-surface-1 p-4 lg:sticky lg:top-[calc(var(--spacing-header)+1.5rem)]">
          <p className="text-caption font-semibold uppercase tracking-wide text-ink-soft">{t(`trainer.${drill}.title`)}</p>
          <div className="mt-3 flex gap-1" aria-hidden>
            {Array.from({ length: ROUNDS }, (_, i) => (
              <span
                key={i}
                className={cx(
                  'h-1.5 flex-1 rounded-full transition-colors duration-(--duration-base)',
                  results[i] ? (results[i].ok ? 'bg-up' : 'bg-down') : i === round ? 'bg-accent' : 'bg-surface-3',
                )}
              />
            ))}
          </div>
          <dl className="mt-4 grid grid-cols-4 gap-3 lg:grid-cols-2">
            <Stat label={t('trainer.stats.round')}>
              {round + 1}/{ROUNDS}
            </Stat>
            <Stat label={t('trainer.stats.accuracy')}>{results.length ? `${Math.round((correct / results.length) * 100)}%` : '—'}</Stat>
            <Stat label={t('trainer.stats.streak')} tone={streak >= 3 ? 'up' : undefined}>
              {streak}
            </Stat>
            <Stat label={t('trainer.stats.time')}>{fmtTime(elapsed)}</Stat>
          </dl>
          <p className="mt-4 hidden text-caption leading-relaxed text-ink-muted lg:block">{t(`trainer.${drill}.keys`)}</p>
        </div>
      </aside>
    </div>
  );
}

function Stat({ label, children, tone }: { label: string; children: ReactNode; tone?: 'up' }) {
  return (
    <div>
      <dt className="text-caption text-ink-soft">{label}</dt>
      <dd className={cx('font-mono text-mono-lg font-semibold tabular-nums', tone === 'up' ? 'text-up' : 'text-ink')}>{children}</dd>
    </div>
  );
}

/** Keys shared by both drills: the answer keys given, and Enter to move on. */
function useRoundKeys(keys: Record<string, () => void>, onNext: () => void, answered: boolean) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable || el.closest('[role="dialog"]'))) return;
      if (answered && e.key === 'Enter') {
        // A focused link or button handles Enter itself.
        if (el && (el.tagName === 'A' || el.tagName === 'BUTTON')) return;
        e.preventDefault();
        onNext();
        return;
      }
      if (!answered && keys[e.key]) {
        e.preventDefault();
        keys[e.key]();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [keys, onNext, answered]);
}

const shake = { x: [0, -7, 7, -4, 4, 0], transition: { duration: 0.36 } };
const pop = { scale: [1, 1.03, 1], transition: { duration: 0.28 } };

function NameRound({ seed, answered, onAnswer, onNext, last }: { seed: string; answered: boolean; onAnswer: (ok: boolean) => void; onNext: () => void; last: boolean }) {
  const [picked, setPicked] = useState<string | null>(null);

  /**
   * Derived from `seed` alone, so the question cannot change underneath a learner who is
   * looking at it. Randomness lives in the seed, which only advances when they move on;
   * calling Math.random() inside the memo meant any recompute silently swapped the chart.
   */
  const q = useMemo(() => {
    const rng = new Rng(seed);
    const answer = QUIZ_POOL[Math.floor(rng.float() * QUIZ_POOL.length)];
    // Distractors come from the same family first, so the choice tests the shape rather
    // than whether the learner can tell a candle pattern from a chart pattern.
    const sameGroup = shuffled(
      QUIZ_POOL.filter((p) => p.group === answer.group && p.name !== answer.name),
      rng,
    );
    const others = shuffled(
      QUIZ_POOL.filter((p) => p.group !== answer.group && p.name !== answer.name),
      rng,
    );
    const distractors = [...sameGroup, ...others].slice(0, 3);
    return { answer, options: shuffled([answer, ...distractors], rng) };
  }, [seed]);

  const fig = ALL_FIGS[q.answer.name];
  const lesson = lessonFor(contentIndex.patterns[q.answer.name]?.[0]);
  const correct = picked === q.answer.name;

  const choose = useCallback(
    (name: string) => {
      if (picked) return;
      setPicked(name);
      onAnswer(name === q.answer.name);
    },
    [picked, onAnswer, q.answer.name],
  );

  const keys = useMemo(() => Object.fromEntries(q.options.map((o, i) => [String(i + 1), () => choose(o.name)])), [q.options, choose]);
  useRoundKeys(keys, onNext, answered);

  return (
    <>
      <FigureFrame title={t('trainer.name.question')} linkable={false} className="my-0">
        {({ large, narrow }) => fig && <CandleSvg bars={fig.bars} height={large ? 420 : narrow ? 220 : 250} width={narrow ? 380 : 640} showVolume={false} />}
      </FigureFrame>

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {q.options.map((o, i) => {
          const isAnswer = o.name === q.answer.name;
          const state = !picked ? 'idle' : isAnswer ? 'right' : o.name === picked ? 'wrong' : 'dim';
          return (
            <m.button
              key={o.name}
              type="button"
              onClick={() => choose(o.name)}
              disabled={!!picked}
              animate={state === 'wrong' ? shake : state === 'right' && picked ? pop : undefined}
              whileTap={picked ? undefined : { scale: 0.98 }}
              className={cx(
                'flex min-h-16 items-center gap-3 rounded-card border px-4 py-3 text-left text-body font-semibold transition-[border-color,background-color,opacity] duration-(--duration-fast) sm:min-h-20',
                state === 'idle' && 'border-line bg-surface-1 hover:border-accent hover:bg-accent-soft',
                state === 'right' && 'border-up bg-up-soft text-up',
                state === 'wrong' && 'border-down bg-down-soft text-down',
                state === 'dim' && 'border-line bg-surface-1 opacity-50',
              )}
            >
              <Kbd className="max-sm:hidden">{i + 1}</Kbd>
              <span className="flex-1">{o.label}</span>
              {state === 'right' && <Check size={18} aria-hidden />}
              {state === 'wrong' && <X size={18} aria-hidden />}
            </m.button>
          );
        })}
      </div>

      {picked && (
        <Feedback
          ok={correct}
          headline={correct ? t('trainer.name.correct') : t('trainer.name.wrong', { name: q.answer.label })}
          text={fig?.caption}
          lessonPath={lesson?.path}
          lessonTitle={lesson?.title}
          onNext={onNext}
          last={last}
        />
      )}
    </>
  );
}

/** Reveals a chart, hides the next N candles, and asks up or down. */
function NextRound({ seed, answered, onAnswer, onNext, last }: { seed: string; answered: boolean; onAnswer: (ok: boolean) => void; onNext: () => void; last: boolean }) {
  const [guess, setGuess] = useState<'up' | 'down' | null>(null);

  /**
   * Everything about the chart is derived from `seed`. The instrument and timeframe used
   * to come from bare Math.random() calls inside this memo, so a recompute could hand the
   * learner a different chart than the one their answer was scored against.
   */
  const { visible, full, symbol } = useMemo(() => {
    const pick = new Rng(`pick-${seed}`);
    const mkt = new Market(`trainer-${seed}`, SYMBOLS);
    const spec = SYMBOLS[Math.floor(pick.float() * SYMBOLS.length)];
    const feed = mkt.feed(spec.symbol);
    const tf = (['15m', '1h', '1D'] as const)[Math.floor(pick.float() * 3)];
    const need = tf === '1D' ? 390 * (SHOWN + HIDDEN + 5) : tf === '1h' ? 60 * (SHOWN + HIDDEN + 5) : 15 * (SHOWN + HIDDEN + 5);
    feed.ensure(need + 10);
    const agg = aggregate(feed.series, 0, Math.min(need, feed.series.length), tf);
    const start = Math.max(0, agg.length - (SHOWN + HIDDEN));
    const window = agg.slice(start, start + SHOWN + HIDDEN);
    const toOhlc = (b: { open: number; high: number; low: number; close: number; volume: number }): OHLC => ({ o: b.open, h: b.high, l: b.low, c: b.close, v: b.volume });
    return { visible: window.slice(0, SHOWN).map(toOhlc), full: window.map(toOhlc), symbol: spec.symbol };
  }, [seed]);

  const startClose = visible[visible.length - 1]?.c ?? 0;
  const endClose = full[full.length - 1]?.c ?? 0;
  // An exact tie is a push. Folding it into "up" would hand the Higher button free wins in
  // a drill whose entire lesson is that direction is close to a coin flip.
  const tied = endClose === startClose;
  const actual = endClose > startClose ? 'up' : 'down';
  const movePct = startClose ? ((endClose - startClose) / startClose) * 100 : 0;
  const lesson = lessonFor(EDGE_LESSON);

  const choose = useCallback(
    (g: 'up' | 'down') => {
      if (guess) return;
      setGuess(g);
      onAnswer(g === actual || tied);
    },
    [guess, actual, tied, onAnswer],
  );
  const keys = useMemo(() => ({ '1': () => choose('up'), ArrowUp: () => choose('up'), '2': () => choose('down'), ArrowDown: () => choose('down') }), [choose]);
  useRoundKeys(keys, onNext, answered);

  const right = guess === actual || tied;
  return (
    <>
      <FigureFrame title={guess ? t('trainer.next.revealed', { n: HIDDEN }) : t('trainer.next.question', { symbol, n: HIDDEN })} linkable={false} className="my-0">
        {({ large, narrow }) => <CandleSvg bars={guess ? full : visible} height={large ? 420 : narrow ? 220 : 250} width={narrow ? 380 : 640} showVolume fadeBefore={guess ? SHOWN : undefined} />}
      </FigureFrame>

      <div className="grid grid-cols-2 gap-3">
        {(['up', 'down'] as const).map((dir, i) => {
          const state = !guess ? 'idle' : dir === guess ? (right ? 'right' : 'wrong') : 'dim';
          return (
            <m.button
              key={dir}
              type="button"
              onClick={() => choose(dir)}
              disabled={!!guess}
              animate={state === 'wrong' ? shake : state === 'right' ? pop : undefined}
              whileTap={guess ? undefined : { scale: 0.98 }}
              className={cx(
                'flex min-h-16 items-center justify-center gap-2 rounded-card text-body-lg font-semibold shadow-1 transition-[filter,opacity] duration-(--duration-fast) sm:min-h-20',
                dir === 'up' ? 'bg-up text-on-up' : 'bg-down text-on-down',
                state === 'idle' && 'hover:brightness-110',
                state === 'dim' && 'opacity-35',
              )}
            >
              <Kbd className="border-transparent bg-surface-1/20 text-current max-sm:hidden">{i + 1}</Kbd>
              {dir === 'up' ? <TrendingUp size={20} aria-hidden /> : <TrendingDown size={20} aria-hidden />}
              {dir === 'up' ? t('trainer.next.higher') : t('trainer.next.lower')}
            </m.button>
          );
        })}
      </div>

      {guess && (
        <Feedback
          ok={right}
          headline={`${tied ? t('trainer.next.push') : guess === actual ? t('trainer.next.right') : t('trainer.next.wrong')} ${t('trainer.next.moved', { pct: `${movePct >= 0 ? '+' : ''}${movePct.toFixed(2)}%` })}`}
          text={t('trainer.next.explain')}
          lessonPath={lesson?.path}
          lessonTitle={lesson?.title}
          onNext={onNext}
          last={last}
        />
      )}
    </>
  );
}

function Feedback({ ok, headline, text, lessonPath, lessonTitle, onNext, last }: { ok: boolean; headline: string; text?: string; lessonPath?: string; lessonTitle?: string; onNext: () => void; last: boolean }) {
  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
      role="status"
      className={cx('flex flex-col gap-4 rounded-card border p-4 sm:flex-row sm:items-center sm:p-5', ok ? 'border-up bg-up-soft' : 'border-down bg-down-soft')}
    >
      <div className="min-w-0 flex-1">
        <p className={cx('flex items-center gap-2 font-semibold', ok ? 'text-up' : 'text-down')}>
          {ok ? <Check size={18} aria-hidden /> : <X size={18} aria-hidden />}
          {headline}
        </p>
        {text && <p className="mt-1 line-clamp-2 text-body-sm text-ink">{text}</p>}
        {lessonPath && lessonTitle && (
          <Link to={lessonPath} className="mt-2 inline-flex items-center gap-1.5 text-body-sm font-semibold text-accent hover:underline">
            <BookOpen size={14} aria-hidden />
            {t('trainer.learn', { title: lessonTitle })}
          </Link>
        )}
      </div>
      <Button onClick={onNext} className="shrink-0">
        {last ? t('trainer.seeResults') : t('trainer.nextRound')}
        <ArrowRight size={16} aria-hidden />
        <Kbd className="ml-1 border-transparent bg-surface-1/20 text-current max-sm:hidden">↵</Kbd>
      </Button>
    </m.div>
  );
}

function Results({ drill, results, bestStreak, elapsed, newBest, onAgain, onExit }: { drill: Drill; results: RoundResult[]; bestStreak: number; elapsed: number; newBest: boolean; onAgain: () => void; onExit: () => void }) {
  const correct = results.filter((r) => r.ok).length;
  const pct = Math.round((correct / results.length) * 100);
  const avg = results.reduce((s, r) => s + r.ms, 0) / results.length;
  const summary = `${t('trainer.results.summary', { drill: t(`trainer.${drill}.title`), correct, total: results.length, pct, streak: bestStreak, time: fmtTime(elapsed) })} ${results.map((r) => (r.ok ? '🟩' : '🟥')).join('')}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      toast({ title: t('trainer.results.copied'), tone: 'up' });
    } catch {
      toast({ title: t('trainer.results.copyFailed'), description: summary });
    }
  };

  return (
    <m.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      aria-labelledby="trainer-results"
      className="mx-auto max-w-2xl rounded-feature border border-line bg-surface-1 p-6 text-center shadow-2 sm:p-10"
    >
      <p className="text-caption font-semibold uppercase tracking-wide text-ink-soft">{t(`trainer.${drill}.title`)}</p>
      <h2 id="trainer-results" className="mt-2 font-display text-h1 font-semibold">
        {t('trainer.results.title')}
      </h2>
      <p className="mt-4 font-mono text-display font-semibold tabular-nums text-ink">{pct}%</p>
      <p className="text-body text-ink-soft">{t('trainer.results.score', { correct, total: results.length })}</p>
      {newBest && (
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-warn-soft px-3 py-1 text-body-sm font-semibold text-warn">
          <Trophy size={14} aria-hidden /> {t('trainer.results.newBest')}
        </p>
      )}
      <ol className="mt-6 flex justify-center gap-1.5">
        {results.map((r, i) => (
          <li key={i} className={cx('h-3 w-6 rounded-full', r.ok ? 'bg-up' : 'bg-down')}>
            <span className="sr-only">{t('trainer.results.round', { n: i + 1, result: r.ok ? t('trainer.results.right') : t('trainer.results.wrong') })}</span>
          </li>
        ))}
      </ol>
      <dl className="mx-auto mt-6 grid max-w-md grid-cols-3 gap-4 border-y border-line-subtle py-4">
        <Stat label={t('trainer.results.bestStreak')}>{bestStreak}</Stat>
        <Stat label={t('trainer.results.avg')}>{`${(avg / 1000).toFixed(1)}s`}</Stat>
        <Stat label={t('trainer.results.time')}>{fmtTime(elapsed)}</Stat>
      </dl>
      <p className="mx-auto mt-5 max-w-md rounded-control bg-surface-2 px-3 py-2 text-left font-mono text-mono-sm text-ink-soft select-all">{summary}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button onClick={onAgain}>
          <RotateCcw size={15} aria-hidden /> {t('trainer.results.again')}
        </Button>
        <Button variant="secondary" onClick={copy}>
          <Copy size={15} aria-hidden /> {t('trainer.results.copy')}
        </Button>
        <Button variant="ghost" onClick={onExit}>
          <ArrowLeft size={15} aria-hidden /> {t('trainer.results.back')}
        </Button>
      </div>
    </m.section>
  );
}
