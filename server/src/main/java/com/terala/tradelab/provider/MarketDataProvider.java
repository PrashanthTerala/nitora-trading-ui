package com.terala.tradelab.provider;

import com.terala.tradelab.market.Interval;

/**
 * The seam between this service and whoever actually supplies bars.
 *
 * <p>It exists so the default provider — an unofficial, unlicensed endpoint — can be swapped
 * for a licensed vendor by writing one class and changing one property, without the caching,
 * normalisation, throttling or HTTP layer knowing anything changed.
 */
public interface MarketDataProvider {

    /** Short identifier echoed in {@code /api/health} and in each history response's {@code source}. */
    String name();

    /**
     * Fetch raw bars.
     *
     * @param symbol   an already-validated, upper-cased ticker
     * @param interval a resolution the provider serves natively; callers must map 4h to 1h and
     *                 aggregate themselves, because no common provider offers 4h
     * @param range    a range token such as {@code 60d} or {@code 10y}, already capped to what
     *                 this interval supports
     * @throws com.terala.tradelab.error.ApiException 404 when the symbol has no data, 502 when
     *                                                the provider fails or is unparseable,
     *                                                504 on timeout
     */
    ProviderSeries fetch(String symbol, Interval interval, String range);
}
