package com.terala.tradelab.config;

import java.nio.file.Path;
import java.time.Clock;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.terala.tradelab.cache.DiskCache;
import com.terala.tradelab.market.MarketDataService;
import com.terala.tradelab.provider.MarketDataProvider;
import com.terala.tradelab.provider.RateLimiter;
import com.terala.tradelab.provider.YahooChartProvider;

import org.springframework.boot.http.client.ClientHttpRequestFactoryBuilder;
import org.springframework.boot.http.client.ClientHttpRequestFactorySettings;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

/** Wires the pieces together and keeps every timeout and path decision in one readable place. */
@Configuration
public class ServiceConfig {

    /** Injected rather than called statically so cache-expiry tests can move time by hand. */
    @Bean
    public Clock clock() {
        return Clock.systemUTC();
    }

    @Bean
    public RestClient upstreamRestClient(TradeLabProperties properties) {
        TradeLabProperties.Upstream upstream = properties.upstream();
        // A hard read timeout is the whole point: without it a hung upstream would pin a fetch
        // thread indefinitely and the browser would sit on a spinner with no way to recover.
        // simple() rather than detect(): the JDK HttpClient opens a loopback selector the moment
        // it is built, which fails outright in locked-down environments (CI sandboxes, some
        // corporate machines) and would take the whole application context down at startup.
        // HttpURLConnection builds lazily, and HTTP/1.1 is all the chart endpoint needs.
        ClientHttpRequestFactory factory = ClientHttpRequestFactoryBuilder.simple()
                .build(ClientHttpRequestFactorySettings.defaults()
                        .withConnectTimeout(upstream.connectTimeout())
                        .withReadTimeout(upstream.timeout()));
        return RestClient.builder()
                .baseUrl(upstream.yahooBaseUrl())
                .requestFactory(factory)
                .build();
    }

    @Bean
    public RateLimiter upstreamRateLimiter(TradeLabProperties properties) {
        return new RateLimiter(properties.upstream().requestsPerSecond());
    }

    /**
     * The one place a licensed vendor would be substituted: add a provider, select it by name.
     * Everything above this line is provider-agnostic.
     */
    @Bean
    public MarketDataProvider marketDataProvider(TradeLabProperties properties, RestClient restClient,
            ObjectMapper mapper, RateLimiter rateLimiter) {
        String name = properties.provider();
        if (!"yahoo".equalsIgnoreCase(name)) {
            throw new IllegalStateException("Unknown provider '" + name
                    + "'. This build only ships the 'yahoo' provider; add a MarketDataProvider "
                    + "bean for anything else.");
        }
        return new YahooChartProvider(restClient, mapper, properties.upstream(), rateLimiter);
    }

    @Bean
    public DiskCache diskCache(TradeLabProperties properties, ObjectMapper mapper) {
        // Created on demand by DiskCache itself, so a read-only checkout still starts.
        return new DiskCache(Path.of(properties.cache().dir()), mapper);
    }

    @Bean
    public MarketDataService marketDataService(MarketDataProvider provider, DiskCache cache,
            TradeLabProperties properties, Clock clock) {
        return new MarketDataService(provider, cache, properties, clock);
    }
}
