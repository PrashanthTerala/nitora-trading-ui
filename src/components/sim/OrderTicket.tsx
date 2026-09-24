/**
 * The order ticket. Deliberately teaches as it goes: it always shows the money at
 * risk, the risk-to-reward ratio and the position size implied by the 1% rule, so
 * the learner cannot place a trade without seeing what it costs if wrong.
 *
 * One side is chosen, then one button sends it: two always-visible Buy and Sell buttons made
 * the side the last and least considered decision, and a mis-click the easiest mistake to make.
 */
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { m } from 'motion/react';
import { AlertTriangle, CircleAlert } from 'lucide-react';
import { useSim, specOf } from '@/store/sim';
import { defaultQty, riskQty, valueQty, ticketIssues, type TicketIssue } from '@/lib/sizing';
import { equity, buyingPower } from '@/engine/broker/broker';
import type { OrderType, Side } from '@/engine/broker/types';
import { Button } from '@/components/ui/Button';
import { Segmented } from '@/components/ui/Segmented';
import { Switch } from '@/components/ui/Switch';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { cx } from '@/components/ui/cx';
import { t } from '@/i18n';

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

/** With a stop, size by the money at risk; without one there is no risk to size by, only value. */
const RISK_PRESETS = [0.5, 1, 2];
const VALUE_PRESETS = [10, 25, 50];

const label = 'mb-1 flex items-center justify-between text-caption font-semibold uppercase tracking-wide text-ink-soft';
const input = 'h-9 w-full rounded-control border border-line-strong bg-surface-1 px-2.5 font-mono text-mono text-ink tabular-nums outline-none transition-colors duration-(--duration-fast) focus:border-accent';

export function OrderTicket({ symbol, price, prices }: Props) {
  const account = useSim((s) => s.account);
  const placeOrder = useSim((s) => s.placeOrder);
  const spec = specOf(symbol);
  const dp = spec?.decimals ?? 2;
  const hintId = useId();

  const [side, setSide] = useState<Side>('buy');
  const [type, setType] = useState<OrderType>('market');
  /**
   * A fixed default of 100 units is only sensible for a hundred-dollar stock. On an
   * instrument priced in the tens of thousands it opens an eight-figure position against a
   * six-figure account, so the ticket greets you with negative buying power and a lecture
   * about risk you have not taken yet. Size the default to a small slice of equity instead,
   * then let the risk presets do the real work.
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
  const pos = account.positions[symbol];
  const dir = side === 'buy' ? 1 : -1;

  const issues = ticketIssues({
    side,
    type,
    qty,
    price,
    limitPrice,
    stopPrice,
    entry: entryRef,
    buyingPower: bp,
    held: pos?.qty ?? 0,
    bracket: useBracket,
    riskPct: riskPctOfEquity,
  });
  const blocked = issues.some((i) => i.level === 'error');

  const submit = () => {
    setError(null);
    // A stop always sits against the position and a target always sits in its favour,
    // so the same two distances produce a valid bracket for a long or a short.
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

  const presets = useBracket
    ? RISK_PRESETS.map((p) => ({ key: `r${p}`, text: t('sim.order.riskPreset', { pct: p }), qty: riskQty(eq, p, riskPerUnit) }))
    : VALUE_PRESETS.map((p) => ({ key: `v${p}`, text: t('sim.order.valuePreset', { pct: p }), qty: valueQty(eq, p, entryRef) }));
  const hint = TYPES.find((x) => x.id === type)?.hint ?? '';

  return (
    <div className="space-y-4 p-3">
      <SideSwitch side={side} onChange={setSide} />

      <div>
        <OrderTypePicker value={type} onChange={setType} describedBy={hintId} />
        <p id={hintId} className="mt-1.5 text-caption leading-snug text-ink-soft">
          {hint}
        </p>
      </div>

      <div>
        <label htmlFor={`${hintId}-qty`} className={label}>
          {t('sim.order.size', { unit: spec?.unitLabel ?? 'units' })}
        </label>
        <input
          id={`${hintId}-qty`}
          type="number"
          min={0}
          step={1}
          value={qty}
          onChange={(e) => setQty(Math.max(0, parseFloat(e.target.value) || 0))}
          aria-invalid={issues.some((i) => i.code === 'qty' || i.code === 'buyingPower') || undefined}
          className={cx(input, issues.some((i) => i.code === 'qty' || i.code === 'buyingPower') && 'border-down')}
        />
        <div role="group" aria-label={t('sim.order.presets')} className="mt-1.5 grid grid-cols-3 gap-1">
          {presets.map((p) => (
            <button
              key={p.key}
              type="button"
              disabled={p.qty <= 0}
              onClick={() => setQty(p.qty)}
              className={cx(
                'h-7 rounded-control border text-caption font-semibold transition-colors duration-(--duration-fast) disabled:opacity-40',
                qty === p.qty && p.qty > 0 ? 'border-accent bg-accent-soft text-accent' : 'border-line bg-surface-1 text-ink-soft hover:text-ink',
              )}
            >
              {p.text}
            </button>
          ))}
        </div>
      </div>

      {(type === 'limit' || type === 'stop_limit') && <PriceField label={t('sim.order.limit')} value={limitPrice} onChange={edit(setLimitPrice)} dp={dp} price={price} />}
      {(type === 'stop' || type === 'stop_limit') && <PriceField label={t('sim.order.trigger')} value={stopPrice} onChange={edit(setStopPrice)} dp={dp} price={price} />}

      <div className="rounded-panel border border-line bg-surface-1 p-2.5">
        <Switch checked={useBracket} onChange={setUseBracket} label={t('sim.order.bracket')} className="text-caption" />
        {useBracket && (
          <>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <DistanceField label={t('sim.order.stopDist')} value={slDist} onChange={edit(setSlDist)} dp={dp} price={price} tone="down" />
              <DistanceField label={t('sim.order.targetDist')} value={tpDist} onChange={edit(setTpDist)} dp={dp} price={price} tone="up" />
            </div>
            <p className="mt-1.5 flex flex-wrap gap-x-3 font-mono text-mono-sm text-ink-soft">
              <span className="text-down">{t('sim.order.stopAt', { price: round(entryRef - dir * slDist, dp).toFixed(dp) })}</span>
              <span className="text-up">{t('sim.order.targetAt', { price: round(entryRef + dir * tpDist, dp).toFixed(dp) })}</span>
            </p>
          </>
        )}
      </div>

      <div className="flex items-end gap-2">
        <div>
          <span className={label}>{t('sim.order.tif')}</span>
          <Segmented
            size="sm"
            label={t('sim.order.tif')}
            value={tif}
            onChange={setTif}
            options={[
              { value: 'GTC', label: 'GTC' },
              { value: 'DAY', label: 'DAY' },
            ]}
          />
        </div>
        <Button variant="ghost" size="sm" className="ml-auto" onClick={syncPrices}>
          {t('sim.order.resync')}
        </Button>
      </div>

      <input value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('sim.order.note')} aria-label={t('sim.order.note')} className={cx(input, 'font-sans text-body-sm')} />

      {/* the risk readout: the teaching part */}
      <div className="grid grid-cols-3 gap-1.5">
        <RiskTile label={t('sim.order.riskUsd')} tone={useBracket ? 'down' : 'muted'}>
          {useBracket ? <AnimatedNumber value={moneyAtRisk} format={fmtUsd} flash={false} /> : '—'}
        </RiskTile>
        <RiskTile label={t('sim.order.riskPct')} tone={!useBracket ? 'muted' : riskPctOfEquity > 2 ? 'down' : riskPctOfEquity > 1 ? 'warn' : 'up'}>
          {useBracket ? <AnimatedNumber value={riskPctOfEquity} format={(v) => `${v.toFixed(2)}%`} flash={false} /> : '—'}
        </RiskTile>
        <RiskTile label={t('sim.order.rTarget')} tone={!useBracket || rr === 0 ? 'muted' : rr >= 2 ? 'up' : rr >= 1 ? 'warn' : 'down'}>
          {useBracket && rr > 0 ? <AnimatedNumber value={rr} format={(v) => `${v.toFixed(2)}R`} flash={false} /> : '—'}
        </RiskTile>
      </div>
      <dl className="space-y-0.5 text-caption">
        <Row label={t('sim.order.value')} value={fmtUsd(notional)} />
        <Row label={t('sim.order.bpLeft')} value={fmtUsd(bp - notional)} tone={bp - notional < 0 ? 'down' : undefined} />
      </dl>

      {issues.length > 0 && (
        <ul className="space-y-1.5" aria-live="polite">
          {issues.map((i) => (
            <Issue key={i.code} issue={i} />
          ))}
        </ul>
      )}
      {error && (
        <p role="alert" className="rounded-control bg-down-soft px-2.5 py-1.5 text-caption font-semibold text-down">
          {error}
        </p>
      )}

      <Button variant={side === 'buy' ? 'up' : 'down'} size="lg" className="w-full" onClick={submit} disabled={blocked}>
        {t(side === 'buy' ? 'sim.order.submitBuy' : 'sim.order.submitSell', { qty, symbol })}
      </Button>
      {pos && (
        <p className="text-center text-caption text-ink-soft">
          {t('sim.order.holding', { side: t(pos.qty > 0 ? 'sim.order.long' : 'sim.order.short'), qty: Math.abs(pos.qty), price: pos.avgPrice.toFixed(dp) })}
        </p>
      )}
    </div>
  );
}

/** Buy or sell, as a two-way switch whose fill is the side's own colour. */
function SideSwitch({ side, onChange }: { side: Side; onChange: (s: Side) => void }) {
  const id = useId();
  const opts: Side[] = ['buy', 'sell'];
  return (
    <div
      role="radiogroup"
      aria-label={t('sim.order.side')}
      className="grid grid-cols-2 rounded-control border border-line bg-surface-2 p-0.5"
      onKeyDown={(e) => {
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
          e.preventDefault();
          const next = side === 'buy' ? 'sell' : 'buy';
          onChange(next);
          (e.currentTarget.querySelector(`[data-side="${next}"]`) as HTMLButtonElement | null)?.focus();
        }
      }}
    >
      {opts.map((o) => {
        const on = o === side;
        return (
          <button
            key={o}
            type="button"
            role="radio"
            aria-checked={on}
            data-side={o}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(o)}
            className={cx(
              'relative h-9 rounded-[8px] text-body-sm font-semibold transition-colors duration-(--duration-fast)',
              on ? (o === 'buy' ? 'text-on-up' : 'text-on-down') : 'text-ink-soft hover:text-ink',
            )}
          >
            {on && (
              <m.span
                layoutId={`side-${id}`}
                className={cx('absolute inset-0 rounded-[8px] shadow-1', o === 'buy' ? 'bg-up' : 'bg-down')}
                transition={{ type: 'spring', stiffness: 520, damping: 42 }}
              />
            )}
            <span className="relative">{t(o === 'buy' ? 'sim.order.buy' : 'sim.order.sell')}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Four order types in one row, as a radio group. */
function OrderTypePicker({ value, onChange, describedBy }: { value: OrderType; onChange: (v: OrderType) => void; describedBy: string }) {
  const id = useId();
  const index = TYPES.findIndex((x) => x.id === value);
  return (
    <div
      role="radiogroup"
      aria-label={t('sim.order.type')}
      aria-describedby={describedBy}
      className="grid grid-cols-4 rounded-control border border-line bg-surface-2 p-0.5"
      onKeyDown={(e) => {
        const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
        if (!step) return;
        e.preventDefault();
        const next = TYPES[(index + step + TYPES.length) % TYPES.length].id;
        onChange(next);
        (e.currentTarget.querySelector(`[data-type="${next}"]`) as HTMLButtonElement | null)?.focus();
      }}
    >
      {TYPES.map((x) => {
        const on = x.id === value;
        return (
          <button
            key={x.id}
            type="button"
            role="radio"
            aria-checked={on}
            data-type={x.id}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(x.id)}
            className={cx('relative h-7 rounded-[8px] px-1 text-caption font-semibold transition-colors duration-(--duration-fast)', on ? 'text-ink' : 'text-ink-soft hover:text-ink')}
          >
            {on && <m.span layoutId={`type-${id}`} className="absolute inset-0 rounded-[8px] border border-line bg-surface-1 shadow-1" transition={{ type: 'spring', stiffness: 520, damping: 42 }} />}
            <span className="relative whitespace-nowrap">{x.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function RiskTile({ label: text, tone, children }: { label: string; tone: 'up' | 'down' | 'warn' | 'muted'; children: ReactNode }) {
  const cls = { up: 'text-up', down: 'text-down', warn: 'text-warn', muted: 'text-ink-muted' }[tone];
  return (
    <div className="rounded-control border border-line bg-surface-1 px-2 py-1.5">
      <div className="text-caption text-ink-soft">{text}</div>
      <div className={cx('font-mono text-mono font-semibold tabular-nums', cls)}>{children}</div>
    </div>
  );
}

function Issue({ issue }: { issue: TicketIssue }) {
  const text =
    issue.code === 'buyingPower'
      ? t('sim.order.issues.buyingPower', { need: fmtMoney(issue.need ?? 0), have: fmtMoney(issue.have ?? 0) })
      : issue.code === 'risk'
        ? t('sim.order.issues.risk', { pct: (issue.pct ?? 0).toFixed(1) })
        : t(`sim.order.issues.${issue.code}`);
  const error = issue.level === 'error';
  return (
    <li className={cx('flex items-start gap-1.5 text-caption leading-snug', error ? 'font-semibold text-down' : 'text-warn')}>
      {error ? <CircleAlert size={13} className="mt-px shrink-0" aria-hidden /> : <AlertTriangle size={13} className="mt-px shrink-0" aria-hidden />}
      {text}
    </li>
  );
}

function PriceField({ label: text, value, onChange, dp, price }: { label: string; value: number; onChange: (v: number) => void; dp: number; price: number }) {
  const diff = price > 0 ? ((value - price) / price) * 100 : 0;
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className={label}>
        <span>{text}</span>
        <span className="font-mono font-normal normal-case tracking-normal">
          {diff >= 0 ? '+' : ''}
          {diff.toFixed(2)}%
        </span>
      </label>
      <input id={id} type="number" step={1 / 10 ** dp} value={value} onChange={(e) => onChange(parseFloat(e.target.value) || 0)} className={input} />
    </div>
  );
}

/** A bracket leg entered as a distance from the entry, with its percentage shown. */
function DistanceField({ label: text, value, onChange, dp, price, tone }: { label: string; value: number; onChange: (v: number) => void; dp: number; price: number; tone: 'up' | 'down' }) {
  const pct = price > 0 ? (value / price) * 100 : 0;
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className={label}>
        <span className={tone === 'up' ? 'text-up' : 'text-down'}>{text}</span>
        <span className="font-mono font-normal normal-case tracking-normal">{pct.toFixed(2)}%</span>
      </label>
      <input id={id} type="number" min={0} step={1 / 10 ** dp} value={value} onChange={(e) => onChange(Math.max(0, parseFloat(e.target.value) || 0))} className={input} />
    </div>
  );
}

function Row({ label: text, value, tone }: { label: string; value: string; tone?: 'down' }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-ink-soft">{text}</dt>
      <dd className={cx('font-mono font-semibold tabular-nums', tone === 'down' ? 'text-down' : 'text-ink')}>{value}</dd>
    </div>
  );
}

function round(v: number, dp: number) {
  return Math.round(v * 10 ** dp) / 10 ** dp;
}

/** Dollars with the sign before the symbol: -$1,056, not $-1,056. */
export function fmtUsd(v: number) {
  return `${v < 0 ? '-' : ''}$${fmtMoney(Math.abs(v))}`;
}

/** Dollars, grouped the US way whatever the reader's locale: the account is in US dollars. */
export function fmtMoney(v: number) {
  const a = Math.abs(v);
  const s = a >= 1000 ? a.toLocaleString('en-US', { maximumFractionDigits: 0 }) : a.toFixed(2);
  return (v < 0 ? '-' : '') + s;
}
