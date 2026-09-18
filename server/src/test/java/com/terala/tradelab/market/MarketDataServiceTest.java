package com.terala.tradelab.market;

import java.nio.file.Path;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.terala.tradelab.cache.DiskCache;
import com.terala.tradelab.config.TradeLabProperties;
import com.terala.tradelab.dto.HistoryResponse;
import com.terala.tradelab.error.ApiException;
import com.terala.tradelab.provider.MarketDataProvider;
import com.terala.tradelab.provider.ProviderSeries;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.http.HttpStatus;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * The caching, coalescing and aggregation rules, with a hand-driven clock and a stub provider,
 * so no test depends on a network or on wall-clock time.
 */
class MarketDataServiceTest {

    private static final long START = 1_700_000_000L;

    @TempDir
    Path cacheDir;

    private StubProvider provider;
    private MutableClock clock;
    private MarketDataService service;

    @BeforeEach
    void setUp() {
        provider = new StubProvider();
        clock = new MutableClock(Instant.ofEpochSecond(START));
        service = newService();
    }

    @AfterEach
    void tearDown() {
        service.shutdown();
    }

    private MarketDataService newService() {
        TradeLabProperties properties = new TradeLabProperties("stub", "1.0.0", List.of(),
                new TradeLabProperties.Cache(cacheDir.toString(),
                        Duration.ofMinutes(5), Duration.ofMinutes(30), Duration.ofHours(12)),
                new TradeLabProperties.Upstream(Duration.ofSeconds(15), Duration.ofSeconds(5), 5,
                        "http://example.invalid", "test-agent"));
        return new MarketDataService(provider, new DiskCache(cacheDir, new ObjectMapper()),
                properties, clock);
    }

    // ------------------------------------------------------------------ cache TTL

    @Test
    @DisplayName("a second request inside the TTL is served from disk without touching upstream")
    void freshCacheHit() {
        provider.series = daily(3);

        HistoryResponse first = service.history("AAPL", "1d", "1y");
        assertThat(first.cached()).isFalse();
        assertThat(first.stale()).isFalse();
        assertThat(first.fetchedAt()).isEqualTo(START);

        clock.advance(Duration.ofHours(11));   // daily TTL is 12h

        HistoryResponse second = service.history("AAPL", "1d", "1y");
        assertThat(second.cached()).isTrue();
        assertThat(second.stale()).isFalse();
        assertThat(second.bars()).isEqualTo(first.bars());
        assertThat(provider.calls.get()).isEqualTo(1);
    }

    @Test
    @DisplayName("once the TTL lapses the provider is asked again")
    void expiredCacheMiss() {
        provider.series = daily(3);
        service.history("AAPL", "1d", "1y");

        clock.advance(Duration.ofHours(13));   // past the 12h daily TTL

        HistoryResponse refreshed = service.history("AAPL", "1d", "1y");
        assertThat(refreshed.cached()).isFalse();
        assertThat(refreshed.stale()).isFalse();
        assertThat(refreshed.fetchedAt()).isEqualTo(START + Duration.ofHours(13).toSeconds());
        assertThat(provider.calls.get()).isEqualTo(2);
    }

    @Test
    @DisplayName("intraday data expires in minutes, not hours")
    void intradayTtlIsShort() {
        provider.series = daily(2);
        service.history("AAPL", "5m", "5d");

        clock.advance(Duration.ofMinutes(4));
        assertThat(service.history("AAPL", "5m", "5d").cached()).isTrue();

        clock.advance(Duration.ofMinutes(2));   // now 6 minutes in, past the 5m TTL
        assertThat(service.history("AAPL", "5m", "5d").cached()).isFalse();
    }

    @Test
    @DisplayName("stale bars beat an error page when upstream falls over")
    void servesStaleWhenUpstreamFails() {
        provider.series = daily(3);
        HistoryResponse original = service.history("AAPL", "1d", "1y");

        clock.advance(Duration.ofHours(13));
        provider.failure = ApiException.upstreamFailed("upstream exploded", null);

        HistoryResponse stale = service.history("AAPL", "1d", "1y");

        assertThat(stale.cached()).isTrue();
        assertThat(stale.stale()).isTrue();
        assertThat(stale.bars()).isEqualTo(original.bars());
        assertThat(stale.fetchedAt()).isEqualTo(START);   // honest about its real age
    }

    @Test
    @DisplayName("a timeout with nothing cached surfaces as a timeout")
    void failureWithoutCachePropagates() {
        provider.failure = ApiException.upstreamTimeout("too slow", null);

        assertThatThrownBy(() -> service.history("AAPL", "1d", "1y"))
                .isInstanceOf(ApiException.class)
                .extracting(e -> ((ApiException) e).status())
                .isEqualTo(HttpStatus.GATEWAY_TIMEOUT);
    }

    @Test
    @DisplayName("a bad request is never answered from a stale cache")
    void badRequestsAreNotMaskedByTheCache() {
        provider.series = daily(3);
        service.history("AAPL", "1d", "1y");

        assertThatThrownBy(() -> service.history("../etc/passwd", "1d", "1y"))
                .isInstanceOf(ApiException.class)
                .extracting(e -> ((ApiException) e).status())
                .isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    @DisplayName("the cache survives a restart, because it lives on disk")
    void cacheOutlivesTheProcess() {
        provider.series = daily(3);
        service.history("AAPL", "1d", "1y");
        service.shutdown();

        service = newService();
        clock.advance(Duration.ofHours(1));

        assertThat(service.history("AAPL", "1d", "1y").cached()).isTrue();
        assertThat(provider.calls.get()).isEqualTo(1);
    }

    @Test
    @DisplayName("symbol, interval and range each select a different cache entry")
    void cacheKeyCoversAllThreeDimensions() {
        provider.series = daily(3);
        service.history("AAPL", "1d", "1y");
        service.history("MSFT", "1d", "1y");
        service.history("AAPL", "1h", "5d");
        service.history("AAPL", "1d", "2y");
        service.history("aapl", "1d", "1y");    // same entry as the first: case is normalised

        assertThat(provider.calls.get()).isEqualTo(4);
    }

    // ------------------------------------------------------------------ coalescing

    @Test
    @DisplayName("ten simultaneous identical requests cause one upstream fetch")
    void coalescesConcurrentRequests() throws Exception {
        CountDownLatch release = new CountDownLatch(1);
        provider.series = daily(3);
        provider.beforeReturn = release;

        ExecutorService pool = Executors.newFixedThreadPool(10);
        try {
            List<Future<HistoryResponse>> futures = new ArrayList<>();
            for (int i = 0; i < 10; i++) {
                futures.add(pool.submit(() -> service.history("AAPL", "1d", "1y")));
            }
            // Let every caller pile onto the same in-flight future before the fetch completes.
            Thread.sleep(150);
            release.countDown();

            for (Future<HistoryResponse> f : futures) {
                assertThat(f.get(10, TimeUnit.SECONDS).bars()).hasSize(3);
            }
        } finally {
            pool.shutdownNow();
        }

        assertThat(provider.calls.get()).isEqualTo(1);
    }

    // ------------------------------------------------------------------ 4h and capping

    @Test
    @DisplayName("4h is served by fetching 1h and aggregating here")
    void fourHourAggregatesFromHourly() {
        long midnight = 1704153600L;   // 2024-01-02T00:00:00Z
        List<Bar> hourly = new ArrayList<>();
        for (int i = 0; i < 8; i++) {
            hourly.add(new Bar(midnight + i * 3600L, 100 + i, 102 + i, 99 + i, 100.5 + i, 10L));
        }
        provider.series = new ProviderSeries("AAPL", "USD", "NasdaqGS", hourly);

        HistoryResponse response = service.history("AAPL", "4h", "60d");

        assertThat(provider.lastInterval).isEqualTo(Interval.H1);
        assertThat(response.interval()).isEqualTo("4h");
        assertThat(response.bars()).hasSize(2);
        assertThat(response.bars().get(0).time()).isEqualTo(midnight);
        assertThat(response.bars().get(1).time()).isEqualTo(midnight + 14400L);
        assertThat(response.bars().get(0).volume()).isEqualTo(40L);
    }

    @Test
    @DisplayName("an over-long range is capped before the provider ever sees it")
    void capsRangeBeforeFetching() {
        provider.series = daily(2);

        service.history("AAPL", "1m", "10y");
        assertThat(provider.lastRange).isEqualTo("7d");

        service.history("AAPL", "1h", "10y");
        assertThat(provider.lastRange).isEqualTo("730d");

        service.history("AAPL", "1d", null);
        assertThat(provider.lastRange).isEqualTo("10y");
    }

    @Test
    @DisplayName("bars reach the caller normalised, whatever shape the provider sent")
    void normalisesProviderOutput() {
        provider.series = new ProviderSeries("AAPL", "USD", "NasdaqGS", List.of(
                new Bar(300, 3, 4, 2, 3.5, 10),
                new Bar(100, 1, 0.5, 1.4, 1.2, 10),   // high below the body, low above it
                new Bar(100, 1, 2, 0.5, 1.3, 10),     // revision of the same timestamp
                new Bar(200, 2, 3, 1, 2.5, 10)));

        List<Bar> bars = service.history("AAPL", "1d", "1y").bars();

        assertThat(bars).extracting(Bar::time).containsExactly(100L, 200L, 300L);
        assertThat(bars.get(0).close()).isEqualTo(1.3);
        for (Bar b : bars) {
            assertThat(b.high()).isGreaterThanOrEqualTo(Math.max(b.open(), b.close()));
            assertThat(b.low()).isLessThanOrEqualTo(Math.min(b.open(), b.close()));
        }
    }

    @Test
    @DisplayName("a provider that returns nothing usable is a 404, not an empty success")
    void emptySeriesBecomesNotFound() {
        provider.series = new ProviderSeries("AAPL", "USD", "NasdaqGS", List.of());

        assertThatThrownBy(() -> service.history("AAPL", "1d", "1y"))
                .isInstanceOf(ApiException.class)
                .extracting(e -> ((ApiException) e).status())
                .isEqualTo(HttpStatus.NOT_FOUND);
    }

    // ------------------------------------------------------------------ helpers

    private static ProviderSeries daily(int count) {
        List<Bar> bars = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            bars.add(new Bar(1700000000L + i * 86400L, 10 + i, 11 + i, 9 + i, 10.5 + i, 1000));
        }
        return new ProviderSeries("AAPL", "USD", "NasdaqGS", bars);
    }

    /** Records what it was asked and returns whatever the test set up. */
    private static final class StubProvider implements MarketDataProvider {
        final AtomicInteger calls = new AtomicInteger();
        volatile ProviderSeries series;
        volatile ApiException failure;
        volatile CountDownLatch beforeReturn;
        volatile Interval lastInterval;
        volatile String lastRange;

        @Override
        public String name() {
            return "stub";
        }

        @Override
        public ProviderSeries fetch(String symbol, Interval interval, String range) {
            calls.incrementAndGet();
            lastInterval = interval;
            lastRange = range;
            CountDownLatch gate = beforeReturn;
            if (gate != null) {
                try {
                    gate.await(10, TimeUnit.SECONDS);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }
            if (failure != null) {
                throw failure;
            }
            return series;
        }
    }

    /** A clock the test drives by hand, so TTL expiry does not mean sleeping. */
    private static final class MutableClock extends Clock {
        private final AtomicReference<Instant> now;

        MutableClock(Instant start) {
            this.now = new AtomicReference<>(start);
        }

        void advance(Duration d) {
            now.updateAndGet(i -> i.plus(d));
        }

        @Override
        public ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return now.get();
        }
    }
}
