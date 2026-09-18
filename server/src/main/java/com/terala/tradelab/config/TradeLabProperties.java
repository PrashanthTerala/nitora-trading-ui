package com.terala.tradelab.config;

import java.time.Duration;
import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

/**
 * Everything an operator may want to change without editing code. Each field has a default
 * so the service runs from a bare checkout; {@code application.yml} wires environment
 * variables over the top.
 */
@ConfigurationProperties(prefix = "tradelab")
public record TradeLabProperties(
        @DefaultValue("yahoo") String provider,
        @DefaultValue("1.0.0") String version,
        List<String> allowedOrigins,
        @DefaultValue Cache cache,
        @DefaultValue Upstream upstream) {

    /**
     * Disk cache settings. TTLs are grouped by how fast the underlying bars actually move:
     * an intraday bar is stale within minutes, a daily bar is not.
     */
    public record Cache(
            @DefaultValue(".cache") String dir,
            @DefaultValue("5m") Duration intradayTtl,
            @DefaultValue("30m") Duration hourlyTtl,
            @DefaultValue("12h") Duration dailyTtl) {
    }

    public record Upstream(
            @DefaultValue("15s") Duration timeout,
            @DefaultValue("5s") Duration connectTimeout,
            @DefaultValue("5") int requestsPerSecond,
            @DefaultValue("https://query1.finance.yahoo.com") String yahooBaseUrl,
            // The chart endpoint returns 403 to clients that do not look like a browser.
            @DefaultValue("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                    + "(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36") String userAgent) {
    }

    /** Origins that may call this service: the two dev servers plus anything configured. */
    public List<String> effectiveAllowedOrigins() {
        List<String> extra = allowedOrigins == null ? List.of() : allowedOrigins;
        return java.util.stream.Stream
                .concat(java.util.stream.Stream.of("http://localhost:5173", "http://127.0.0.1:5173",
                        "http://localhost:5199", "http://127.0.0.1:5199"), extra.stream())
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .distinct()
                .toList();
    }
}
