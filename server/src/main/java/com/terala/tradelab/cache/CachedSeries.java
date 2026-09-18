package com.terala.tradelab.cache;

import java.util.List;

import com.terala.tradelab.market.Bar;

/**
 * One cache file. Bars stored here are already normalised (and, for 4h, already aggregated),
 * so a cache hit costs a JSON read and nothing else.
 *
 * @param fetchedAt unix seconds at which the provider was actually called; TTL is measured
 *                  from this, not from the file's mtime, so touching a file cannot extend its life
 */
public record CachedSeries(
        String key,
        String symbol,
        String interval,
        String range,
        String currency,
        String exchange,
        long fetchedAt,
        List<Bar> bars) {
}
