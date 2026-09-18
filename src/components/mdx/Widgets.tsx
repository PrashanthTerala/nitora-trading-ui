/**
 * Small interactive widgets and text helpers usable inside lessons.
 */
import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { FlaskConical, ArrowRight } from 'lucide-react';
import { GLOSSARY_INDEX } from '@/content/glossary';

/** Glossary term with hover definition. <Term id="spread">the spread</Term> */
export function Term({ id, children }: { id: string; children?: ReactNode }) {
  const entry = GLOSSARY_INDEX[id];
  return (
    <Link to={`/glossary#${id}`} className="group relative cursor-help border-b border-dotted border-accent/70 text-inherit no-underline" title={entry?.short}>
      {children ?? entry?.term ?? id}
    </Link>
  );
}

/** Call to action into the simulator or trainer. */
export function TryIt({ to = '/simulator', title = 'Try it in the simulator', children }: { to?: string; title?: string; children: ReactNode }) {
  return (
    <div className="not-prose my-7 flex flex-col gap-3 rounded-2xl border border-accent/40 bg-gradient-to-br from-accent/10 to-transparent p-5 sm:flex-row sm:items-center">
      <div className="flex-1">
        <div className="mb-1 flex items-center gap-2 text-sm font-bold text-accent">
          <FlaskConical size={16} /> {title}
        </div>
        <div className="text-[15px] leading-relaxed text-ink">{children}</div>
      </div>
      <Link to={to} className="btn-primary shrink-0">
        Open <ArrowRight size={14} />
      </Link>
    </div>
  );
}

/** Two-column comparison. <Compare left="Trader" right="Investor"> two lists </Compare> */
export function Compare({ left, right, children }: { left: string; right: string; children: ReactNode }) {
  return (
    <div className="not-prose compare my-6 grid gap-3 rounded-2xl border border-line bg-surface p-4 sm:grid-cols-2">
      <div className="compare-heads contents">
        <div className="text-sm font-bold text-accent">{left}</div>
        <div className="text-sm font-bold text-accent">{right}</div>
      </div>
      {children}
    </div>
  );
}

/** A big stat with a label. */
export function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-4 py-3 text-center">
      <div className="font-mono text-2xl font-bold text-accent">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wide text-ink-soft">{label}</div>
    </div>
  );
}

export function StatRow({ children }: { children: ReactNode }) {
  return <div className="not-prose my-6 grid grid-cols-2 gap-3 md:grid-cols-4">{children}</div>;
}

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
    <div className="not-prose my-7 rounded-2xl border border-line bg-surface p-5">
      <h4 className="mb-3 font-bold">Position size calculator</h4>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Account size ($)" value={account} onChange={setAccount} />
        <Field label="Risk per trade (%)" value={riskPct} onChange={setRiskPct} step={0.25} />
        <Field label="Entry price" value={entry} onChange={setEntry} step={0.1} />
        <Field label="Stop loss price" value={stop} onChange={setStop} step={0.1} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat value={`$${riskAmt.toFixed(0)}`} label="Money at risk" />
        <Stat value={`$${perShare.toFixed(2)}`} label="Risk per share" />
        <Stat value={`${shares}`} label="Shares to buy" />
        <Stat value={`$${notional.toFixed(0)}`} label="Position value" />
      </div>
      <p className="mt-3 text-sm text-ink-soft">Shares = money at risk divided by the distance from entry to stop. The stop decides the size, never the other way around.</p>
    </div>
  );
}

/** Interactive expectancy calculator. */
export function ExpectancyCalc() {
  const [winRate, setWinRate] = useState(45);
  const [avgWin, setAvgWin] = useState(2);
  const [avgLoss, setAvgLoss] = useState(1);
  const exp = (winRate / 100) * avgWin - (1 - winRate / 100) * avgLoss;
  const over100 = exp * 100;
  return (
    <div className="not-prose my-7 rounded-2xl border border-line bg-surface p-5">
      <h4 className="mb-3 font-bold">Expectancy calculator (in R)</h4>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Win rate (%)" value={winRate} onChange={setWinRate} />
        <Field label="Average win (R)" value={avgWin} onChange={setAvgWin} step={0.1} />
        <Field label="Average loss (R)" value={avgLoss} onChange={setAvgLoss} step={0.1} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Stat value={`${exp >= 0 ? '+' : ''}${exp.toFixed(2)} R`} label="Expectancy per trade" />
        <Stat value={`${over100 >= 0 ? '+' : ''}${over100.toFixed(0)} R`} label="Over 100 trades" />
      </div>
      <p className={`mt-3 text-sm font-semibold ${exp > 0 ? 'text-up' : 'text-down'}`}>
        {exp > 0 ? 'Positive expectancy: this system makes money over many trades.' : 'Negative expectancy: this system loses money no matter how you feel about it.'}
      </p>
    </div>
  );
}

/** Shows how much gain is needed to recover a loss. */
export function RecoveryTable() {
  const rows = useMemo(() => [5, 10, 20, 30, 40, 50, 60, 75, 90].map((l) => ({ loss: l, gain: (l / (100 - l)) * 100 })), []);
  return (
    <div className="not-prose my-6 overflow-hidden rounded-xl border border-line">
      <table className="w-full text-sm">
        <thead className="bg-panel text-left text-xs uppercase tracking-wide text-ink-soft">
          <tr>
            <th className="px-4 py-2">If you lose</th>
            <th className="px-4 py-2">You need to gain</th>
            <th className="px-4 py-2">Just to get back to even</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.loss} className="border-t border-line">
              <td className="px-4 py-2 font-mono text-down">-{r.loss}%</td>
              <td className="px-4 py-2 font-mono text-up">+{r.gain.toFixed(0)}%</td>
              <td className="px-4 py-2">
                <div className="h-2 rounded bg-panel">
                  <div className="h-2 rounded bg-accent" style={{ width: `${Math.min(100, r.gain / 9)}%` }} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
    for (let i = 0; i < trades; i++) {
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
  return (
    <div className="not-prose my-7 rounded-2xl border border-line bg-surface p-5">
      <h4 className="mb-3 font-bold">Losing-streak simulator</h4>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Win rate (%)" value={winRate} onChange={setWinRate} />
        <Field label="Number of trades" value={trades} onChange={setTrades} step={10} />
        <div className="flex items-end">
          <button type="button" className="btn-ghost" onClick={() => setSeed((s) => s + 1)}>
            Re-roll
          </button>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-0.5">
        {result.seq.map((w, i) => (
          <span key={i} className={`h-3 w-3 rounded-sm ${w ? 'bg-up' : 'bg-down'}`} />
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Stat value={`${result.longestLoss}`} label="Longest losing streak" />
        <Stat value={`${result.longestWin}`} label="Longest winning streak" />
      </div>
    </div>
  );
}

function Field({ label, value, onChange, step = 1 }: { label: string; value: number; onChange: (v: number) => void; step?: number }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</span>
      <input type="number" step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value) || 0)} className="input w-full" />
    </label>
  );
}
