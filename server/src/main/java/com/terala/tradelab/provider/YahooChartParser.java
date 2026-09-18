package com.terala.tradelab.provider;

import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.terala.tradelab.error.ApiException;
import com.terala.tradelab.market.Bar;

/**
 * Reads the chart endpoint's JSON. Split out from the HTTP client so the messy part — the part
 * that has to cope with an undocumented shape full of nulls — can be tested without a network.
 *
 * <p>The payload is column-oriented: one {@code timestamp} array and four parallel price arrays
 * under {@code indicators.quote[0]}. Any cell may be null (a halted minute, a pre-market gap),
 * and the arrays are not guaranteed to be the same length, so every row is checked rather than
 * assumed.
 */
public final class YahooChartParser {

    private YahooChartParser() {
    }

    public static ProviderSeries parse(ObjectMapper mapper, String symbol, String body) {
        JsonNode root;
        try {
            root = mapper.readTree(body);
        } catch (Exception e) {
            throw ApiException.upstreamFailed(
                    "The market data provider returned a response that could not be read.", e);
        }
        return parse(symbol, root);
    }

    public static ProviderSeries parse(String symbol, JsonNode root) {
        JsonNode chart = path(root, "chart");
        if (chart.isMissingNode()) {
            throw ApiException.upstreamFailed(
                    "The market data provider returned an unexpected response.", null);
        }

        JsonNode error = path(chart, "error");
        if (!error.isMissingNode() && !error.isNull()) {
            throw fromProviderError(symbol, error);
        }

        JsonNode result = path(chart, "result");
        if (!result.isArray() || result.isEmpty()) {
            throw ApiException.noData("The market data provider has no data for " + symbol + ".");
        }
        JsonNode series = result.get(0);

        JsonNode meta = path(series, "meta");
        String currency = text(meta, "currency");
        String exchange = text(meta, "exchangeName");

        JsonNode timestamps = path(series, "timestamp");
        JsonNode quote = path(series, "indicators").path("quote");
        if (!timestamps.isArray() || timestamps.isEmpty() || !quote.isArray() || quote.isEmpty()) {
            throw ApiException.noData(
                    "The market data provider returned no bars for " + symbol + " at that resolution.");
        }
        JsonNode q = quote.get(0);
        JsonNode opens = path(q, "open");
        JsonNode highs = path(q, "high");
        JsonNode lows = path(q, "low");
        JsonNode closes = path(q, "close");
        JsonNode volumes = path(q, "volume");

        List<Bar> bars = new ArrayList<>(timestamps.size());
        for (int i = 0; i < timestamps.size(); i++) {
            JsonNode t = timestamps.get(i);
            if (t == null || !t.isNumber()) {
                continue;
            }
            Double open = number(opens, i);
            Double high = number(highs, i);
            Double low = number(lows, i);
            Double close = number(closes, i);
            // A row with any missing price cannot be drawn or filled against, so it is dropped
            // outright rather than interpolated — inventing prices in a trading trainer is worse
            // than showing a gap.
            if (open == null || high == null || low == null || close == null) {
                continue;
            }
            Double volume = number(volumes, i);
            bars.add(new Bar(t.asLong(), open, high, low, close,
                    volume == null ? 0L : (long) Math.max(0d, volume)));
        }

        if (bars.isEmpty()) {
            throw ApiException.noData(
                    "The market data provider returned no usable bars for " + symbol + ".");
        }
        return new ProviderSeries(symbol, currency, exchange, bars);
    }

    /**
     * Provider errors are mostly "unknown ticker", which is the caller's problem and a 404.
     * Anything else is the provider misbehaving, which is ours and a 502.
     */
    private static ApiException fromProviderError(String symbol, JsonNode error) {
        String code = text(error, "code");
        String description = text(error, "description");
        String lower = (code == null ? "" : code).toLowerCase(java.util.Locale.ROOT)
                + " " + (description == null ? "" : description).toLowerCase(java.util.Locale.ROOT);
        if (lower.contains("not found") || lower.contains("no data")) {
            return ApiException.noData("The market data provider has no data for " + symbol + ".");
        }
        return ApiException.upstreamFailed(
                "The market data provider rejected the request for " + symbol + ".", null);
    }

    private static JsonNode path(JsonNode node, String field) {
        return node == null ? com.fasterxml.jackson.databind.node.MissingNode.getInstance() : node.path(field);
    }

    private static String text(JsonNode node, String field) {
        JsonNode v = path(node, field);
        return v.isTextual() ? v.asText() : null;
    }

    /** @return the numeric value at {@code i}, or null when absent, null or non-numeric */
    private static Double number(JsonNode array, int i) {
        if (array == null || !array.isArray() || i >= array.size()) {
            return null;
        }
        JsonNode v = array.get(i);
        if (v == null || !v.isNumber()) {
            return null;
        }
        double d = v.asDouble();
        return (Double.isNaN(d) || Double.isInfinite(d)) ? null : d;
    }
}
