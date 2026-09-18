package com.terala.tradelab.provider;

import java.util.List;

import com.terala.tradelab.market.Bar;

/**
 * What a provider hands back: the bars plus the two pieces of metadata the browser shows
 * beside the chart. Bars here are raw — unsorted, possibly duplicated — and are cleaned by
 * {@link com.terala.tradelab.market.Bars#normalize} before anyone sees them.
 */
public record ProviderSeries(String symbol, String currency, String exchange, List<Bar> bars) {

    public ProviderSeries withBars(List<Bar> replacement) {
        return new ProviderSeries(symbol, currency, exchange, replacement);
    }
}
