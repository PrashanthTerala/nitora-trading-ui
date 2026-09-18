package com.terala.tradelab.dto;

import java.util.List;

import com.terala.tradelab.market.Bar;

/**
 * {@code GET /api/history}.
 *
 * <p>{@code cached} says the bars came off disk rather than the wire; {@code stale} says they
 * came off disk <em>after</em> an upstream failure, so they are older than the TTL allows. The
 * browser uses the pair to decide whether to show a quiet "using cached data" notice.
 *
 * @param fetchedAt unix seconds at which these bars were actually pulled from the provider
 */
public record HistoryResponse(
        String symbol,
        String interval,
        String currency,
        String exchange,
        List<Bar> bars,
        String source,
        long fetchedAt,
        boolean cached,
        boolean stale) {
}
