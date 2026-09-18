package com.terala.tradelab.market;

/**
 * One OHLCV candle. {@code time} is unix SECONDS because that is what the charting library
 * in the browser expects; the upstream provider also uses seconds, so nothing converts.
 */
public record Bar(long time, double open, double high, double low, double close, long volume) {
}
