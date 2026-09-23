/**
 * Interactive calculators for the risk module. Each sits in the same widget chrome -- a titled
 * frame, inputs, then a mono readout -- so a reader learns the pattern once.
 */
import { useId, useMemo, useState, type ReactNode } from 'react';
import { RotateCcw, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { cx } from '@/components/ui/cx';
import { t } from '@/i18n';

export function WidgetFrame({ title, children, footer }: { title: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <section className="not-prose my-8 overflow-hidden rounded-card border border-line bg-surface-1 shadow-1">
      <header className="flex items-center gap-2.5 border-b border-line-subtle bg-surface-2 px-5 py-3">
        <SlidersHorizontal size={16} strokeWidth={1.75} className="text-accent" aria-hidden />
        <h4 className="flex-1 font-semibold text-ink">{title}</h4>
        <Chip tone="accent">{t('mdx.interactive')}</Chip>
      </header>
      <div className="p-5">{children}</div>
      {footer && <footer className="border-t border-line-subtle px-5 py-3 text-body-sm text-ink-soft">{footer}</footer>}
    </section>
  );
}

/** A number readout: label above, value in mono. `tone` tints the value, never the tile. */
export function Readout({ label, value, tone }: { label: string; value: string; tone?: 'up' | 'down' }) {
  return (
    <div className="rounded-panel border border-line-subtle bg-bg px-4 py-3">
      <div className="text-caption text-ink-muted">{label}</div>
      <output className={cx('mt-1 block font-mono text-mono-lg font-semibold tabular-nums', tone === 'up' ? 'text-up' : tone === 'down' ? 'text-down' : 'text-ink')}>{value}</output>
    </div>
  );
}

function Field({ label, value, onChange, step = 1, min }: { label: string; value: number; onChange: (v: number) => void; step?: number; min?: number }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-caption font-semibold text-ink-soft">
        {label}
      </label>
      <input id={id} type="number" inputMode="decimal" step={step} min={min} value={value} onChange={(e) => onChange(parseFloat(e.target.value) || 0)} className="input w-full font-mono" />
    </div>
  );
}

const money = (n: number, digits = 0) => `$${n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
const signed = (n: number, digits: number) => `${n >= 0 ? '+' : '−'}${Math.abs(n).toFixed(digits)}`;

/** Interactive position-size calculator. */
export function PositionSizer() {
  const [account, setAccount] = useState(10000);
  const [riskPct, setRiskPct] = useState(1);
  const [entry, setEntry] = useState(50);
  const [stop, setStop] = useState(48);
  const riskAmt = account * (riskPct / 100);
  const perShare = Math.abs(entry - stop);
  const shares = perShare > 0 ? Math.floor(riskAmt / perShare) : 0;
  const notional = shares * entry;
  return (
    <WidgetFrame title={t('mdx.sizer.title')} footer={t('mdx.sizer.note')}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('mdx.sizer.account')} value={account} onChange={setAccount} min={0} />
        <Field label={t('mdx.sizer.risk')} value={riskPct} onChange={setRiskPct} step={0.25} min={0} />
        <Field label={t('mdx.sizer.entry')} value={entry} onChange={setEntry} step={0.1} min={0} />
        <Field label={t('mdx.sizer.stop')} value={stop} onChange={setStop} step={0.1} min={0} />
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4" aria-live="polite">
        <Readout label={t('mdx.sizer.atRisk')} value={money(riskAmt)} />
        <Readout label={t('mdx.sizer.perShare')} value={money(perShare, 2)} />
        <Readout label={t('mdx.sizer.shares')} value={shares.toLocaleString('en-US')} />
        <Readout label={t('mdx.sizer.value')} value={money(notional)} />
      </div>
    </WidgetFrame>
  );
}

/** Interactive expectancy calculator. */
export function ExpectancyCalc() {
  const [winRate, setWinRate] = useState(45);
  const [avgWin, setAvgWin] = useState(2);
  const [avgLoss, setAvgLoss] = useState(1);
  const exp = (winRate / 100) * avgWin - (1 - winRate / 100) * avgLoss;
  const positive = exp > 0;
  return (
    <WidgetFrame
      title={t('mdx.expectancy.title')}
      footer={<span className={cx('font-semibold', positive ? 'text-up' : 'text-down')}>{positive ? t('mdx.expectancy.positive') : t('mdx.expectancy.negative')}</span>}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label={t('mdx.expectancy.winRate')} value={winRate} onChange={setWinRate} min={0} />
        <Field label={t('mdx.expectancy.avgWin')} value={avgWin} onChange={setAvgWin} step={0.1} min={0} />
        <Field label={t('mdx.expectancy.avgLoss')} value={avgLoss} onChange={setAvgLoss} step={0.1} min={0} />
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3" aria-live="polite">
        <Readout label={t('mdx.expectancy.perTrade')} value={`${signed(exp, 2)} R`} tone={positive ? 'up' : 'down'} />
        <Readout label={t('mdx.expectancy.per100')} value={`${signed(exp * 100, 0)} R`} tone={positive ? 'up' : 'down'} />
      </div>
    </WidgetFrame>
  );
}

/** Shows how much gain is needed to recover a loss. */
export function RecoveryTable() {
  const rows = useMemo(() => [5, 10, 20, 30, 40, 50, 60, 75, 90].map((l) => ({ loss: l, gain: (l / (100 - l)) * 100 })), []);
  return (
    <WidgetFrame title={t('mdx.recovery.title')}>
      <div className="table-scroll -mx-1 my-0">
        <table className="w-full text-body-sm">
          <thead>
            <tr className="text-left text-caption uppercase tracking-[0.08em] text-ink-muted">
              <th className="pb-2 pr-4 font-semibold">{t('mdx.recovery.lose')}</th>
              <th className="pb-2 pr-4 font-semibold">{t('mdx.recovery.gain')}</th>
              <th className="w-1/2 pb-2 font-semibold">{t('mdx.recovery.even')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.loss} className="border-t border-line-subtle">
                <td className="py-2 pr-4 font-mono text-down tabular-nums">−{r.loss}%</td>
                <td className="py-2 pr-4 font-mono text-up tabular-nums">+{r.gain.toFixed(0)}%</td>
                <td className="py-2">
                  <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                    {/* scaleX, not width: only transforms animate cheaply, and 900% fills the bar */}
                    <div className="h-2 origin-left rounded-full bg-accent" style={{ transform: `scaleX(${Math.min(1, r.gain / 900)})` }} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </WidgetFrame>
  );
}

/** Simulates many random trade sequences to show streaks are normal. */
export function StreakSimulator() {
  const [winRate, setWinRate] = useState(50);
  const [trades, setTrades] = useState(100);
  const [seed, setSeed] = useState(1);
  const result = useMemo(() => {
    let x = seed * 9301 + 49297;
    const rnd = () => {
      x = (x * 9301 + 49297) % 233280;
      return x / 233280;
    };
    let longestLoss = 0;
    let longestWin = 0;
    let curL = 0;
    let curW = 0;
    const seq: boolean[] = [];
    for (let i = 0; i < Math.min(trades, 1000); i++) {
      const w = rnd() < winRate / 100;
      seq.push(w);
      if (w) {
        curW++;
        curL = 0;
      } else {
        curL++;
        curW = 0;
      }
      longestLoss = Math.max(longestLoss, curL);
      longestWin = Math.max(longestWin, curW);
    }
    return { seq, longestLoss, longestWin };
  }, [winRate, trades, seed]);
  const wins = result.seq.filter(Boolean).length;
  return (
    <WidgetFrame title={t('mdx.streak.title')}>
      <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <Field label={t('mdx.streak.winRate')} value={winRate} onChange={setWinRate} min={0} />
        <Field label={t('mdx.streak.trades')} value={trades} onChange={setTrades} step={10} min={1} />
        <Button variant="secondary" onClick={() => setSeed((s) => s + 1)}>
          <RotateCcw size={15} strokeWidth={1.75} aria-hidden /> {t('mdx.streak.reroll')}
        </Button>
      </div>
      <div className="mt-5 flex flex-wrap gap-0.5" role="img" aria-label={t('mdx.streak.sequence', { wins, losses: result.seq.length - wins })}>
        {result.seq.map((w, i) => (
          <span key={i} className={cx('h-3 w-3 rounded-[3px]', w ? 'bg-up' : 'bg-down')} />
        ))}
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3" aria-live="polite">
        <Readout label={t('mdx.streak.longestLoss')} value={String(result.longestLoss)} tone="down" />
        <Readout label={t('mdx.streak.longestWin')} value={String(result.longestWin)} tone="up" />
      </div>
    </WidgetFrame>
  );
}
