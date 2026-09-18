package com.terala.tradelab.provider;

import java.net.SocketTimeoutException;
import java.net.http.HttpTimeoutException;
import java.util.concurrent.TimeoutException;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.terala.tradelab.config.TradeLabProperties;
import com.terala.tradelab.error.ApiException;
import com.terala.tradelab.market.Interval;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;

/**
 * Default provider: Yahoo Finance's public chart endpoint.
 *
 * <p>It needs no API key but it is undocumented and unsupported — see the licensing section of
 * the README before pointing this at anything but your own machine. Practical consequences that
 * shape this class: it returns 403 to clients without a browser-like {@code User-Agent}, it
 * answers 404 with a JSON body rather than an empty one, and it will happily rate-limit a noisy
 * caller, so every call goes through a {@link RateLimiter} and a hard timeout.
 */
public class YahooChartProvider implements MarketDataProvider {

    private static final Logger log = LoggerFactory.getLogger(YahooChartProvider.class);

    private final RestClient restClient;
    private final ObjectMapper mapper;
    private final TradeLabProperties.Upstream config;
    private final RateLimiter rateLimiter;

    public YahooChartProvider(RestClient restClient, ObjectMapper mapper,
            TradeLabProperties.Upstream config, RateLimiter rateLimiter) {
        this.restClient = restClient;
        this.mapper = mapper;
        this.config = config;
        this.rateLimiter = rateLimiter;
    }

    @Override
    public String name() {
        return "yahoo";
    }

    @Override
    public ProviderSeries fetch(String symbol, Interval interval, String range) {
        if (interval == Interval.H4) {
            // Guard rather than silently mis-fetch: the caller owes us the 1h aggregation.
            throw new IllegalArgumentException("Yahoo has no 4h resolution; fetch 1h and aggregate");
        }
        rateLimiter.acquire();

        ResponseEntity<String> response;
        try {
            response = restClient.get()
                    // The symbol goes through as a URI variable so the builder encodes '^' and
                    // '=' exactly once; hand-concatenating it risks double-encoding ^GSPC.
                    .uri(b -> b.path("/v8/finance/chart/{symbol}")
                            .queryParam("range", range)
                            .queryParam("interval", interval.code())
                            .queryParam("includePrePost", "false")
                            .build(symbol))
                    .header("User-Agent", config.userAgent())
                    .header("Accept", "application/json")
                    .retrieve()
                    // Yahoo puts the reason in the body even on 4xx, so we read every response
                    // ourselves instead of letting RestClient throw on status.
                    .onStatus(status -> true, (request, res) -> { })
                    .toEntity(String.class);
        } catch (ResourceAccessException e) {
            throw transportFailure(symbol, e);
        } catch (ApiException e) {
            throw e;
        } catch (RuntimeException e) {
            throw ApiException.upstreamFailed(
                    "Could not reach the market data provider for " + symbol + ".", e);
        }

        HttpStatus status = HttpStatus.resolve(response.getStatusCode().value());
        String body = response.getBody();

        if (status == HttpStatus.TOO_MANY_REQUESTS) {
            log.warn("Upstream rate-limited the request for {} {} {}", symbol, interval.code(), range);
            throw ApiException.upstreamFailed(
                    "The market data provider is rate-limiting this machine. Try again shortly.", null);
        }
        if (body == null || body.isBlank()) {
            if (response.getStatusCode().value() == 404) {
                throw ApiException.noData("The market data provider has no data for " + symbol + ".");
            }
            throw ApiException.upstreamFailed(
                    "The market data provider returned an empty response for " + symbol + ".", null);
        }

        try {
            return YahooChartParser.parse(mapper, symbol, body);
        } catch (ApiException e) {
            throw e;
        } catch (RuntimeException e) {
            throw ApiException.upstreamFailed(
                    "The market data provider returned data that could not be understood.", e);
        }
    }

    /**
     * A read timeout and a dead network look the same to RestClient; only the cause tells them
     * apart, and the caller needs the difference to choose between 504 and 502.
     */
    private ApiException transportFailure(String symbol, ResourceAccessException e) {
        for (Throwable t = e.getCause(); t != null; t = t.getCause()) {
            if (t instanceof SocketTimeoutException || t instanceof HttpTimeoutException
                    || t instanceof TimeoutException) {
                return ApiException.upstreamTimeout(
                        "The market data provider did not respond in time for " + symbol + ".", e);
            }
        }
        return ApiException.upstreamFailed(
                "Could not reach the market data provider for " + symbol + ".", e);
    }
}
