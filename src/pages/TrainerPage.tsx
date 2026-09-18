/**
 * Two drills:
 *  1. Name the pattern — shows a preset figure without its label and asks which it is.
 *  2. Next candles — shows a synthetic chart and asks whether price closes higher or
 *     lower over the following bars. Deliberately humbling: it teaches that a good
 *     read is an edge, not a certainty.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, X, RotateCcw, Brain, TrendingUp, TrendingDown, Trophy } from 'lucide-react';
import { CandleSvg } from '@/components/figures/CandleSvg';
import { CANDLE_PATTERNS } from '@/content/figures/candlePatterns';
import { CHART_PATTERNS } from '@/content/figures/chartPatterns';
import { Market } from '@/engine/market/feed';
import { SYMBOLS } from '@/engine/market/symbols';
import { aggregate } from '@/engine/market/generator';
import type { OHLC } from '@/engine/market/types';
import { useProgress } from '@/store/progress';
import { Rng } from '@/lib/rng';

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

export function TrainerPage() {
  const [mode, setMode] = useState<'name' | 'next'>('name');
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-extrabold tracking-tight">
          <Brain className="text-accent" /> Pattern Trainer
        </h1>
        <p className="mt-1 text-ink-soft">Recognition is a skill built by repetition, not by reading. Five minutes a day here beats an hour of theory.</p>
      </div>
      <div className="flex gap-1 rounded-lg bg-panel p-1">
        <button type="button" onClick={() => setMode('name')} className={`flex-1 rounded-md px-4 py-2 text-sm font-semibold transition ${mode === 'name' ? 'bg-surface text-accent shadow-sm' : 'text-ink-soft'}`}>
          Name the pattern
        </button>
        <button type="button" onClick={() => setMode('next')} className={`flex-1 rounded-md px-4 py-2 text-sm font-semibold transition ${mode === 'next' ? 'bg-surface text-accent shadow-sm' : 'text-ink-soft'}`}>
          Next candles
        </button>
      </div>
      {mode === 'name' ? <NameGame /> : <NextCandleGame />}
    </div>
  );
}

function NameGame() {
  const trainerBest = useProgress((s) => s.trainerBest);
  const setTrainerBest = useProgress((s) => s.setTrainerBest);
  const [round, setRound] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [asked, setAsked] = useState(0);

  const q = useMemo(() => {
    const rng = new Rng(`name-${round}-${Math.floor(round / 1)}`);
    const seedShift = Math.floor(Math.random() * 1e9);
    const r2 = new Rng(`${round}-${seedShift}`);
    const answer = QUIZ_POOL[Math.floor(r2.float() * QUIZ_POOL.length)];
    const sameGroup = QUIZ_POOL.filter((p) => p.group === answer.group && p.name !== answer.name);
    const others = QUIZ_POOL.filter((p) => p.group !== answer.group && p.name !== answer.name);
    const distractors: typeof QUIZ_POOL = [];
    const pool = [...sameGroup].sort(() => r2.float() - 0.5);
    while (distractors.length < 3 && pool.length) distractors.push(pool.shift()!);
    const pool2 = [...others].sort(() => r2.float() - 0.5);
    while (distractors.length < 3 && pool2.length) distractors.push(pool2.shift()!);
    const options = [answer, ...distractors].sort(() => rng.float() - 0.5);
    return { answer, options };
  }, [round]);

  const fig = ALL_FIGS[q.answer.name];
  const correct = picked === q.answer.name;

  const next = () => {
    setPicked(null);
    setRound((r) => r + 1);
  };

  const choose = (name: string) => {
    if (picked) return;
    setPicked(name);
    setAsked((a) => a + 1);
    if (name === q.answer.name) {
      const s = score + 1;
      setScore(s);
      const st = streak + 1;
      setStreak(st);
      setTrainerBest('name-streak', st);
    } else {
      setStreak(0);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm">
        <div className="flex gap-4">
          <span className="text-ink-soft">
            Score <strong className="font-mono text-ink">{score}</strong> / {asked}
          </span>
          <span className="text-ink-soft">
            Streak <strong className="font-mono text-ink">{streak}</strong>
          </span>
        </div>
        <span className="flex items-center gap-1 text-xs text-ink-soft">
          <Trophy size={13} /> Best streak {trainerBest['name-streak'] ?? 0}
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-surface p-3">
        {fig && <CandleSvg bars={fig.bars} height={260} showVolume={false} />}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {q.options.map((o) => {
          const isAnswer = o.name === q.answer.name;
          let cls = 'border-line hover:border-accent/60 hover:bg-accent/5';
          if (picked) {
            if (isAnswer) cls = 'border-up bg-up/10';
            else if (o.name === picked) cls = 'border-down bg-down/10';
            else cls = 'border-line opacity-50';
          }
          return (
            <button key={o.name} type="button" onClick={() => choose(o.name)} disabled={!!picked} className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-left font-medium transition ${cls}`}>
              {picked && isAnswer && <Check size={16} className="text-up" />}
              {picked && o.name === picked && !isAnswer && <X size={16} className="text-down" />}
              {o.label}
            </button>
          );
        })}
      </div>

      {picked && (
        <div className={`rounded-xl border p-4 ${correct ? 'border-up/40 bg-up/5' : 'border-down/40 bg-down/5'}`}>
          <p className="font-bold">{correct ? 'Correct.' : `Not quite — that is a ${q.answer.label}.`}</p>
          {fig?.caption && <p className="mt-1 text-sm text-ink-soft">{fig.caption}</p>}
          <button type="button" onClick={next} className="btn-primary mt-3">
            Next pattern
          </button>
        </div>
      )}
    </div>
  );
}

/** Reveals a chart, hides the next N candles, and asks up or down. */
function NextCandleGame() {
  const trainerBest = useProgress((s) => s.trainerBest);
  const setTrainerBest = useProgress((s) => s.setTrainerBest);
  const [round, setRound] = useState(0);
  const [guess, setGuess] = useState<'up' | 'down' | null>(null);
  const [score, setScore] = useState(0);
  const [asked, setAsked] = useState(0);

  const HIDDEN = 5;
  const SHOWN = 45;

  const { visible, full, symbol } = useMemo(() => {
    const seed = `trainer-${round}-${Math.floor(Math.random() * 1e6)}`;
    const m = new Market(seed, SYMBOLS);
    const spec = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    const feed = m.feed(spec.symbol);
    const tf = (['15m', '1h', '1D'] as const)[Math.floor(Math.random() * 3)];
    const need = tf === '1D' ? 390 * (SHOWN + HIDDEN + 5) : tf === '1h' ? 60 * (SHOWN + HIDDEN + 5) : 15 * (SHOWN + HIDDEN + 5);
    feed.ensure(need + 10);
    const agg = aggregate(feed.series, 0, Math.min(need, feed.series.length), tf);
    const start = Math.max(0, agg.length - (SHOWN + HIDDEN));
    const window = agg.slice(start, start + SHOWN + HIDDEN);
    const toOhlc = (b: { open: number; high: number; low: number; close: number; volume: number }): OHLC => ({ o: b.open, h: b.high, l: b.low, c: b.close, v: b.volume });
    return { visible: window.slice(0, SHOWN).map(toOhlc), full: window.map(toOhlc), symbol: spec.symbol };
  }, [round]);

  const startClose = visible[visible.length - 1]?.c ?? 0;
  const endClose = full[full.length - 1]?.c ?? 0;
  const actual = endClose >= startClose ? 'up' : 'down';
  const movePct = startClose ? ((endClose - startClose) / startClose) * 100 : 0;

  const choose = useCallback(
    (g: 'up' | 'down') => {
      if (guess) return;
      setGuess(g);
      setAsked((a) => a + 1);
      if (g === actual) {
        const s = score + 1;
        setScore(s);
        setTrainerBest('next-candle', s);
      }
    },
    [guess, actual, score, setTrainerBest],
  );

  useEffect(() => {
    setGuess(null);
  }, [round]);

  const hitRate = asked ? (score / asked) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-ink-soft">
          Correct <strong className="font-mono text-ink">{score}</strong> / {asked}
          {asked >= 5 && <strong className={`ml-2 font-mono ${hitRate >= 55 ? 'text-up' : hitRate >= 45 ? 'text-ink' : 'text-down'}`}>{hitRate.toFixed(0)}%</strong>}
        </span>
        <span className="flex items-center gap-1 text-xs text-ink-soft">
          <Trophy size={13} /> Best run {trainerBest['next-candle'] ?? 0}
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-surface p-3">
        <CandleSvg bars={guess ? full : visible} height={280} showVolume fadeBefore={guess ? undefined : undefined} />
        <p className="mt-1 text-center text-xs text-ink-soft">
          {guess ? `The next ${HIDDEN} candles are revealed.` : `Where does ${symbol} close after ${HIDDEN} more candles?`}
        </p>
      </div>

      {!guess ? (
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={() => choose('up')} className="btn-up py-3 text-base">
            <TrendingUp size={18} /> Higher
          </button>
          <button type="button" onClick={() => choose('down')} className="btn-down py-3 text-base">
            <TrendingDown size={18} /> Lower
          </button>
        </div>
      ) : (
        <div className={`rounded-xl border p-4 ${guess === actual ? 'border-up/40 bg-up/5' : 'border-down/40 bg-down/5'}`}>
          <p className="font-bold">
            {guess === actual ? 'Right direction.' : 'Wrong direction.'} Price moved {movePct >= 0 ? '+' : ''}
            {movePct.toFixed(2)}%.
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            Do not read too much into any single result. Over many rounds most people land near 50%, which is exactly the point: direction alone is close to a coin flip. Edges come
            from where you enter, where you exit and how much you risk, not from prediction.
          </p>
          <button type="button" onClick={() => setRound((r) => r + 1)} className="btn-primary mt-3">
            <RotateCcw size={14} /> Next chart
          </button>
        </div>
      )}
    </div>
  );
}
