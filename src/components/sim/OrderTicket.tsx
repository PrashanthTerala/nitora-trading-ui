/**
 * The order ticket. Deliberately teaches as it goes: it always shows the money at
 * risk, the risk-to-reward ratio and the position size implied by the 1% rule, so
 * the learner cannot place a trade without seeing what it costs if wrong.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Calculator } from 'lucide-react';
import { useSim, specOf } from '@/store/sim';
import { defaultQty } from '@/lib/sizing';
import { equity, buyingPower } from '@/engine/broker/broker';
import type { OrderType, Side } from '@/engine/broker/types';

interface Props {
  symbol: string;
  price: number;
  prices: Record<string, number>;
}

const TYPES: { id: OrderType; label: string; hint: string }[] = [
  { id: 'market', label: 'Market', hint: 'Fills immediately at the current price. You get speed, not a guaranteed price.' },
  { id: 'limit', label: 'Limit', hint: 'Fills only if price reaches your limit, and fills at that limit. You get the price, not a guaranteed fill.' },
  { id: 'stop', label: 'Stop', hint: 'Becomes a market order when price reaches the trigger. Used to enter breakouts or to exit losers.' },
  { id: 'stop_limit', label: 'Stop limit', hint: 'Becomes a limit order at the trigger. Protects against a terrible fill, risks no fill at all.' },
];

export function OrderTicket({ symbol, price, prices }: Props) {
  const account = useSim((s) => s.account);
  const placeOrder = useSim((s) => s.placeOrder);
  const spec = specOf(symbol);
  const dp = spec?.decimals ?? 2;

  const [type, setType] = useState<OrderType>('market');
  /**
   * A fixed default of 100 units is only sensible for a hundred-dollar stock. On an
   * instrument priced in the tens of thousands it opens an eight-figure position against a
   * six-figure account, so the ticket greets you with negative buying power and a lecture
   * about risk you have not taken yet. Size the default to a small slice of equity instead,
   * then let the 1%-risk button do the real work.
   */
  const [qty, setQty] = useState(() => defaultQty(price, account.settings.startingCash));
  const [limitPrice, setLimitPrice] = useState<number>(() => round(price, dp));
  const [stopPrice, setStopPrice] = useState<number>(() => round(price, dp));
  const [useBracket, setUseBracket] = useState(true);
  // Switching instrument keeps the ticket open, so the size has to follow the new price.
  useEffect(() => {
    setQty(defaultQty(price, account.settings.startingCash));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol]);
  /**
   * The bracket is entered as a DISTANCE from the entry, not as an absolute price.
   * That is how real platforms do it, it keeps the ticket correct for both long and
   * short (a stop is simply "this far against me"), and it teaches the thing that
   * actually matters: risk is a distance, and the distance decides the position size.
   */
  const [slDist, setSlDist] = useState<number>(() => round(price * 0.01, dp));
  const [tpDist, setTpDist] = useState<number>(() => round(price * 0.02, dp));
  const [tif, setTif] = useState<'GTC' | 'DAY'>('GTC');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  /** Set once the user edits a price field, so we stop auto-following the market. */
  const touched = useRef(false);
  const lastSymbol = useRef(symbol);
  const syncedAt = useRef(price);

  /**
   * Price fields follow the market until the user edits one. Switching symbol always
   * resets them, because a stop of 70.20 is nonsense on an instrument trading at 61,400.
   * While untouched we only re-sync on a meaningful drift, so the inputs do not flicker
   * on every tick while the market is playing.
   */
  useEffect(() => {
    if (!price) return;
    const symbolChanged = lastSymbol.current !== symbol;
    if (symbolChanged) {
      touched.current = false;
      lastSymbol.current = symbol;
    }
    if (touched.current) return;
    const drifted = syncedAt.current === 0 || Math.abs(price - syncedAt.current) / price > 0.005;
    if (!symbolChanged && !drifted) return;
    syncedAt.current = price;
    setLimitPrice(round(price, dp));
    setStopPrice(round(price, dp));
    setSlDist(round(price * 0.01, dp));
    setTpDist(round(price * 0.02, dp));
  }, [symbol, price, dp]);

  const edit = (setter: (v: number) => void) => (v: number) => {
    touched.current = true;
    setter(v);
  };

  const eq = useMemo(() => equity(account, prices), [account, prices]);
  const bp = useMemo(() => buyingPower(account, prices), [account, prices]);

  const entryRef = type === 'market' ? price : type === 'stop' || type === 'stop_limit' ? stopPrice : limitPrice;
  const riskPerUnit = useBracket ? Math.abs(slDist) : 0;
  const rewardPerUnit = useBracket ? Math.abs(tpDist) : 0;
  const rr = riskPerUnit > 0 ? rewardPerUnit / riskPerUnit : 0;
  const moneyAtRisk = riskPerUnit * qty;
  const riskPctOfEquity = eq > 0 ? (moneyAtRisk / eq) * 100 : 0;
  const notional = entryRef * qty;
  const onePctQty = riskPerUnit > 0 ? Math.floor((eq * 0.01) / riskPerUnit) : 0;

  const submit = (side: Side) => {
    setError(null);
    // A stop always sits against the position and a target always sits in its favour,
    // so the same two distances produce a valid bracket for a long or a short.
    const dir = side === 'buy' ? 1 : -1;
    const bracket =
      useBracket && (slDist > 0 || tpDist > 0)
        ? {
            stopLoss: slDist > 0 ? round(entryRef - dir * slDist, dp) : undefined,
            takeProfit: tpDist > 0 ? round(entryRef + dir * tpDist, dp) : undefined,
          }
        : undefined;
    const order = placeOrder({
      symbol,
      side,
      qty,
      type,
      limitPrice: type === 'limit' || type === 'stop_limit' ? limitPrice : undefined,
      stopPrice: type === 'stop' || type === 'stop_limit' ? stopPrice : undefined,
      tif,
      bracket,
      note: note || undefined,
    });
    if (order.status === 'rejected') setError(order.rejectReason ?? 'Order rejected');
    else setNote('');
  };

  const syncPrices = () => {
    touched.current = false;
    syncedAt.current = price;
    setLimitPrice(round(price, dp));
    setStopPrice(round(price, dp));
    setSlDist(round(price * 0.01, dp));
    setTpDist(round(price * 0.02, dp));
  };

  const pos = account.positions[symbol];

  return (
    <div className="space-y-3 p-3">
      <div className="grid grid-cols-4 gap-1">
        {TYPES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setType(t.id)}
            title={t.hint}
            className={`rounded-md px-1 py-1.5 text-[11px] font-semibold transition ${type === t.id ? 'bg-accent text-white' : 'bg-panel text-ink-soft hover:text-ink'}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <p className="text-[11px] leading-snug text-ink-soft">{TYPES.find((t) => t.id === type)!.hint}</p>

      <label className="block">
        <span className="mb-1 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
          Quantity ({spec?.unitLabel ?? 'units'})
          {onePctQty > 0 && (
            <button type="button" onClick={() => setQty(onePctQty)} className="font-normal normal-case tracking-normal text-accent hover:underline">
              use 1% risk: {onePctQty}
            </button>
          )}
        </span>
        <input type="number" min={0} step={spec?.kind === 'crypto' ? 0.01 : 1} value={qty} onChange={(e) => setQty(Math.max(0, parseFloat(e.target.value) || 0))} className="input w-full" />
      </label>

      {(type === 'limit' || type === 'stop_limit') && (
        <PriceField label="Limit price" value={limitPrice} onChange={edit(setLimitPrice)} dp={dp} price={price} />
      )}
      {(type === 'stop' || type === 'stop_limit') && <PriceField label="Stop trigger" value={stopPrice} onChange={edit(setStopPrice)} dp={dp} price={price} />}

      <div className="rounded-lg border border-line p-2">
        <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold">
          <input type="checkbox" checked={useBracket} onChange={(e) => setUseBracket(e.target.checked)} className="accent-[var(--color-accent)]" />
          Attach stop loss and take profit
        </label>
        {useBracket && (
          <>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <DistanceField label="Stop distance" value={slDist} onChange={edit(setSlDist)} dp={dp} price={price} tone="down" />
              <DistanceField label="Target distance" value={tpDist} onChange={edit(setTpDist)} dp={dp} price={price} tone="up" />
            </div>
            <p className="mt-1.5 font-mono text-[10.5px] leading-relaxed text-ink-soft">
              If long: stop <span className="text-down">{round(entryRef - slDist, dp).toFixed(dp)}</span>, target <span className="text-up">{round(entryRef + tpDist, dp).toFixed(dp)}</span>
              <br />
              If short: stop <span className="text-down">{round(entryRef + slDist, dp).toFixed(dp)}</span>, target <span className="text-up">{round(entryRef - tpDist, dp).toFixed(dp)}</span>
            </p>
          </>
        )}
        {!useBracket && (
          <p className="mt-1 flex items-start gap-1 text-[11px] text-warn">
            <AlertTriangle size={12} className="mt-0.5 shrink-0" /> No stop means no defined risk. The journal cannot compute R for this trade.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-soft">Time in force</span>
          <select value={tif} onChange={(e) => setTif(e.target.value as 'GTC' | 'DAY')} className="input w-full">
            <option value="GTC">GTC</option>
            <option value="DAY">DAY</option>
          </select>
        </label>
        <div className="flex items-end">
          <button type="button" onClick={syncPrices} className="btn-ghost w-full justify-center text-xs">
            Reset to market
          </button>
        </div>
      </div>

      <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Why are you taking this trade?" className="input w-full text-xs" />

      {/* risk readout — the teaching part */}
      <div className="rounded-lg bg-panel p-2 text-xs">
        <div className="mb-1 flex items-center gap-1 font-semibold text-ink-soft">
          <Calculator size={12} /> Before you click
        </div>
        <Row label="Position value" value={`$${fmtMoney(notional)}`} />
        <Row label="Buying power left" value={`$${fmtMoney(bp - notional)}`} tone={bp - notional < 0 ? 'down' : undefined} />
        {useBracket && (
          <>
            <Row label="Money at risk" value={`$${fmtMoney(moneyAtRisk)}`} tone="down" />
            <Row label="Risk as % of account" value={`${riskPctOfEquity.toFixed(2)}%`} tone={riskPctOfEquity > 2 ? 'down' : riskPctOfEquity > 1 ? 'warn' : 'up'} />
            <Row label="Risk to reward" value={rr > 0 ? `1 : ${rr.toFixed(2)}` : '—'} tone={rr >= 2 ? 'up' : rr >= 1 ? 'warn' : 'down'} />
          </>
        )}
        {riskPctOfEquity > 2 && useBracket && <p className="mt-1 text-[11px] font-semibold text-down">That is more than 2% of the account on one trade. Module 7 explains why that ends badly.</p>}
      </div>

      {error && <p className="rounded-md bg-down/15 px-2 py-1.5 text-xs font-semibold text-down">{error}</p>}

      <div className="grid grid-cols-2 gap-2">
        <button type="button" className="btn-up" onClick={() => submit('buy')} disabled={qty <= 0}>
          Buy / Long
        </button>
        <button type="button" className="btn-down" onClick={() => submit('sell')} disabled={qty <= 0}>
          Sell / Short
        </button>
      </div>
      {pos && (
        <p className="text-center text-[11px] text-ink-soft">
          You hold {pos.qty > 0 ? 'long' : 'short'} {Math.abs(pos.qty)} at {pos.avgPrice.toFixed(dp)}. A trade in the opposite direction reduces or flips it.
        </p>
      )}
    </div>
  );
}

function PriceField({ label, value, onChange, dp, price, tone }: { label: string; value: number; onChange: (v: number) => void; dp: number; price: number; tone?: 'up' | 'down' }) {
  const diff = price > 0 ? ((value - price) / price) * 100 : 0;
  return (
    <label className="block">
      <span className="mb-1 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
        <span className={tone === 'up' ? 'text-up' : tone === 'down' ? 'text-down' : undefined}>{label}</span>
        <span className="font-mono font-normal normal-case tracking-normal">{diff >= 0 ? '+' : ''}{diff.toFixed(2)}%</span>
      </span>
      <input type="number" step={1 / 10 ** dp} value={value} onChange={(e) => onChange(parseFloat(e.target.value) || 0)} className="input w-full" />
    </label>
  );
}

/** A bracket leg entered as a distance from the entry, with its percentage shown. */
function DistanceField({ label, value, onChange, dp, price, tone }: { label: string; value: number; onChange: (v: number) => void; dp: number; price: number; tone: 'up' | 'down' }) {
  const pct = price > 0 ? (value / price) * 100 : 0;
  return (
    <label className="block">
      <span className="mb-1 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
        <span className={tone === 'up' ? 'text-up' : 'text-down'}>{label}</span>
        <span className="font-mono font-normal normal-case tracking-normal">{pct.toFixed(2)}%</span>
      </span>
      <input type="number" min={0} step={1 / 10 ** dp} value={value} onChange={(e) => onChange(Math.max(0, parseFloat(e.target.value) || 0))} className="input w-full" />
    </label>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: 'up' | 'down' | 'warn' }) {
  const cls = tone === 'up' ? 'text-up' : tone === 'down' ? 'text-down' : tone === 'warn' ? 'text-warn' : 'text-ink';
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-ink-soft">{label}</span>
      <span className={`font-mono font-semibold ${cls}`}>{value}</span>
    </div>
  );
}

function round(v: number, dp: number) {
  return Math.round(v * 10 ** dp) / 10 ** dp;
}

export function fmtMoney(v: number) {
  const a = Math.abs(v);
  const s = a >= 1000 ? a.toLocaleString(undefined, { maximumFractionDigits: 0 }) : a.toFixed(2);
  return (v < 0 ? '-' : '') + s;
}
