/**
 * The fictional instruments in the simulator. Each has a "personality" that drives the
 * synthetic generator so learners meet calm, trending, mean-reverting and gappy markets.
 * Parameters are expressed as annualised figures and converted inside the generator.
 */
export type AssetKind = 'stock' | 'index' | 'metal' | 'crypto' | 'energy' | 'biotech' | 'forex';

export interface SymbolSpec {
  symbol: string;
  name: string;
  kind: AssetKind;
  description: string;
  basePrice: number;
  /** annualised volatility, e.g. 0.35 = 35% */
  annualVol: number;
  /** annualised drift, e.g. 0.08 */
  annualDrift: number;
  /** 0 = pure random walk, 1 = strong pull back to a slow moving mean */
  meanReversion: number;
  /** probability of a jump in any given minute */
  jumpProb: number;
  /** jump size as a multiple of one-minute sigma */
  jumpSize: number;
  /** overnight gap sigma multiplier (relative to daily sigma) */
  gapFactor: number;
  /** how often the regime flips per day (0.1 = roughly every 10 days) */
  regimeFlip: number;
  tickSize: number;
  decimals: number;
  /** baseline volume per minute */
  baseVolume: number;
  /** multiplier for the size of a unit: 1 share, 1 coin, 1 lot */
  unitLabel: string;
}

export const SYMBOLS: SymbolSpec[] = [
  {
    symbol: 'NOVA',
    name: 'Nova Dynamics',
    kind: 'stock',
    description: 'High-growth tech stock. Fast, trendy, and prone to sharp reversals. Great for learning momentum and the pain of chasing.',
    basePrice: 142,
    annualVol: 0.55,
    annualDrift: 0.15,
    meanReversion: 0.05,
    jumpProb: 0.0015,
    jumpSize: 5,
    gapFactor: 1.2,
    regimeFlip: 0.15,
    tickSize: 0.01,
    decimals: 2,
    baseVolume: 9000,
    unitLabel: 'shares',
  },
  {
    symbol: 'BLUE',
    name: 'Bluechip Industrial',
    kind: 'stock',
    description: 'A calm, boring blue chip. Small candles, slow trends. The kindest place to practise reading price.',
    basePrice: 86,
    annualVol: 0.18,
    annualDrift: 0.07,
    meanReversion: 0.1,
    jumpProb: 0.0003,
    jumpSize: 3,
    gapFactor: 0.6,
    regimeFlip: 0.08,
    tickSize: 0.01,
    decimals: 2,
    baseVolume: 4000,
    unitLabel: 'shares',
  },
  {
    symbol: 'AURM',
    name: 'Aurum Metals (gold-like)',
    kind: 'metal',
    description: 'Behaves like gold: mean-reverting ranges punctuated by grinding trends. Ideal for range trading and Bollinger practice.',
    basePrice: 2350,
    annualVol: 0.16,
    annualDrift: 0.04,
    meanReversion: 0.5,
    jumpProb: 0.0005,
    jumpSize: 3,
    gapFactor: 0.7,
    regimeFlip: 0.06,
    tickSize: 0.1,
    decimals: 1,
    baseVolume: 1800,
    unitLabel: 'oz',
  },
  {
    symbol: 'CRYP',
    name: 'Cryptonite',
    kind: 'crypto',
    description: 'Crypto-like: brutal volatility, huge overnight gaps (it trades while you sleep), violent wicks. Respect your stops.',
    basePrice: 61400,
    annualVol: 0.85,
    annualDrift: 0.2,
    meanReversion: 0.02,
    jumpProb: 0.002,
    jumpSize: 6,
    gapFactor: 2.5,
    regimeFlip: 0.2,
    tickSize: 1,
    decimals: 0,
    baseVolume: 120,
    unitLabel: 'coins',
  },
  {
    symbol: 'IDX',
    name: 'TradeLab 500 Index',
    kind: 'index',
    description: 'A broad market index: smooth, trending, with occasional sharp sell-offs. The backdrop for everything else.',
    basePrice: 5120,
    annualVol: 0.15,
    annualDrift: 0.09,
    meanReversion: 0.08,
    jumpProb: 0.0004,
    jumpSize: 4,
    gapFactor: 0.8,
    regimeFlip: 0.07,
    tickSize: 0.25,
    decimals: 2,
    baseVolume: 30000,
    unitLabel: 'units',
  },
  {
    symbol: 'PETR',
    name: 'Petrolux Energy',
    kind: 'energy',
    description: 'Oil-linked energy name: long trends driven by supply shocks, with news jumps. Good for trend following.',
    basePrice: 74.5,
    annualVol: 0.32,
    annualDrift: 0.05,
    meanReversion: 0.08,
    jumpProb: 0.001,
    jumpSize: 4,
    gapFactor: 1.0,
    regimeFlip: 0.1,
    tickSize: 0.01,
    decimals: 2,
    baseVolume: 6000,
    unitLabel: 'shares',
  },
  {
    symbol: 'BIOX',
    name: 'Bioxa Therapeutics',
    kind: 'biotech',
    description: 'Small-cap biotech: quiet drift punctuated by enormous gaps on trial results. Teaches event risk and why stops can fail.',
    basePrice: 18.4,
    annualVol: 0.7,
    annualDrift: 0.0,
    meanReversion: 0.05,
    jumpProb: 0.0025,
    jumpSize: 8,
    gapFactor: 2.2,
    regimeFlip: 0.25,
    tickSize: 0.01,
    decimals: 2,
    baseVolume: 2500,
    unitLabel: 'shares',
  },
  {
    symbol: 'FXEU',
    name: 'Euro / Dollar (forex-like)',
    kind: 'forex',
    description: 'A major currency pair: tiny moves measured in pips, tight ranges, and trends that only show on higher timeframes.',
    basePrice: 1.0842,
    annualVol: 0.075,
    annualDrift: 0.0,
    meanReversion: 0.3,
    jumpProb: 0.0004,
    jumpSize: 3,
    gapFactor: 0.4,
    regimeFlip: 0.08,
    tickSize: 0.0001,
    decimals: 4,
    baseVolume: 15000,
    unitLabel: 'units',
  },
];

export const SYMBOL_MAP: Record<string, SymbolSpec> = Object.fromEntries(SYMBOLS.map((s) => [s.symbol, s]));

export function formatPrice(symbol: string, p: number) {
  const spec = SYMBOL_MAP[symbol];
  return p.toFixed(spec?.decimals ?? 2);
}
