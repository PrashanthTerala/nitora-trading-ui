export type Side = 'buy' | 'sell';
export type OrderType = 'market' | 'limit' | 'stop' | 'stop_limit';
export type OrderStatus = 'working' | 'filled' | 'cancelled' | 'rejected';
export type TimeInForce = 'GTC' | 'DAY';

export interface Order {
  id: string;
  symbol: string;
  side: Side;
  qty: number;
  type: OrderType;
  limitPrice?: number;
  stopPrice?: number;
  /** stop-limit: becomes true once the stop price is touched */
  triggered?: boolean;
  status: OrderStatus;
  tif: TimeInForce;
  createdAt: number;
  filledAt?: number;
  fillPrice?: number;
  /** entry orders can carry a bracket that is placed when they fill */
  bracket?: { takeProfit?: number; stopLoss?: number };
  /** exit legs: id of the sibling that must be cancelled when this fills */
  ocoId?: string;
  /** exit legs only reduce an existing position */
  reduceOnly?: boolean;
  role?: 'entry' | 'take_profit' | 'stop_loss' | 'exit' | 'liquidation';
  rejectReason?: string;
  /** optional plan the learner attached */
  note?: string;
}

export interface Position {
  symbol: string;
  /** signed: positive long, negative short */
  qty: number;
  avgPrice: number;
  openedAt: number;
  /** the stop the trade was opened with, for R-multiple maths */
  initialStop?: number;
  initialRiskPerUnit?: number;
  /** accumulated exits for the running round-trip */
  exitQty: number;
  exitValue: number;
  fees: number;
  maxQty: number;
  entryValue: number;
  entryQtyTotal: number;
  tpOrderId?: string;
  slOrderId?: string;
  note?: string;
}

export interface Fill {
  id: string;
  orderId: string;
  symbol: string;
  side: Side;
  qty: number;
  price: number;
  time: number;
  fee: number;
  role?: Order['role'];
}

export interface Trade {
  id: string;
  symbol: string;
  direction: 'long' | 'short';
  qty: number;
  entryPrice: number;
  exitPrice: number;
  entryTime: number;
  exitTime: number;
  pnl: number;
  fees: number;
  /** pnl divided by the initial risk, when a stop was set */
  rMultiple?: number;
  initialRisk?: number;
  exitReason?: 'take_profit' | 'stop_loss' | 'manual' | 'liquidation';
  tags: string[];
  notes: string;
  /** stamped from the entry order's note */
  plan?: string;
  mistakes?: string[];
}

export interface AccountSettings {
  startingCash: number;
  commissionPerOrder: number;
  slippageBps: number;
  leverage: number; // 1 = cash only
  allowShort: boolean;
  maintenanceMargin: number; // fraction of gross exposure
}

export interface AccountState {
  cash: number;
  positions: Record<string, Position>;
  orders: Order[];
  fills: Fill[];
  trades: Trade[];
  equityCurve: { time: number; equity: number }[];
  peakEquity: number;
  settings: AccountSettings;
  events: BrokerEvent[];
}

export interface BrokerEvent {
  id: string;
  time: number;
  kind: 'fill' | 'reject' | 'cancel' | 'margin_call' | 'info';
  text: string;
}

export const DEFAULT_SETTINGS: AccountSettings = {
  startingCash: 100000,
  commissionPerOrder: 0,
  slippageBps: 2,
  leverage: 2,
  allowShort: true,
  maintenanceMargin: 0.25,
};
