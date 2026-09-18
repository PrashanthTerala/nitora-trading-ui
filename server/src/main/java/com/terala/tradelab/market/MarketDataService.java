package com.terala.tradelab.market;

import java.time.Clock;
import java.time.Duration;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import com.terala.tradelab.cache.CachedSeries;
import com.terala.tradelab.cache.DiskCache;
import com.terala.tradelab.config.TradeLabProperties;
import com.terala.tradelab.dto.HistoryResponse;
import com.terala.tradelab.error.ApiException;
import com.terala.tradelab.provider.MarketDataProvider;
import com.terala.tradelab.provider.ProviderSeries;

import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Validation, caching, request coalescing and 4h aggregation — everything between the HTTP
 * layer and the provider.
 *
 * <p>Coalescing matters more than it looks: a learner with the course open in several tabs, or
 * a hot-reloading dev server, will ask for the same series several times within a second. One
 * in-flight future per cache key turns that into a single upstream call, which is both faster
 * and the difference between being a polite client and being rate-limited.
 */
public class MarketDataService {

    private static final Logger log = LoggerFactory.getLogger(MarketDataService.class);

    private final MarketDataProvider provider;
    private final DiskCache cache;
    private final TradeLabProperties properties;
    private final Clock clock;

    private final ConcurrentHashMap<String, CompletableFuture<HistoryResponse>> inFlight =
            new ConcurrentHashMap<>();

    /**
     * A small dedicated pool rather than the common ForkJoinPool: these tasks block on a socket
     * for up to fifteen seconds, and starving the common pool would stall unrelated work.
     */
    private final ExecutorService fetchers;

    public MarketDataService(MarketDataProvider provider, DiskCache cache,
            TradeLabProperties properties, Clock clock) {
        this.provider = provider;
        this.cache = cache;
        this.properties = properties;
        this.clock = clock;
        AtomicInteger seq = new AtomicInteger();
        // Four threads is already more parallelism than the ~5-per-second upstream throttle can
        // use; extra work queues instead of being rejected, which keeps a burst of tabs working.
        ThreadPoolExecutor pool = new ThreadPoolExecutor(4, 4, 60L, TimeUnit.SECONDS,
                new LinkedBlockingQueue<>(), r -> {
                    Thread t = new Thread(r, "market-fetch-" + seq.incrementAndGet());
                    t.setDaemon(true);
                    return t;
                });
        pool.allowCoreThreadTimeOut(true);
        this.fetchers = pool;
    }

    @PreDestroy
    public void shutdown() {
        fetchers.shutdownNow();
    }

    public String providerName() {
        return provider.name();
    }

    /**
     * @param rawSymbol   caller-supplied ticker, validated here
     * @param rawInterval one of 1m, 5m, 15m, 1h, 4h, 1d
     * @param rawRange    optional; null or blank means "the most this interval can give"
     */
    public HistoryResponse history(String rawSymbol, String rawInterval, String rawRange) {
        String symbol = SymbolValidator.normalize(rawSymbol);
        Interval interval = Interval.fromCode(rawInterval);
        String range = interval.capRange(rawRange);
        String key = symbol + "|" + interval.code() + "|" + range;

        CompletableFuture<HistoryResponse> future = inFlight.computeIfAbsent(key,
                k -> CompletableFuture.supplyAsync(() -> load(symbol, interval, range, k), fetchers));
        try {
            return future.join();
        } catch (CompletionException e) {
            throw unwrap(e);
        } finally {
            // Removed only once the work is finished, so every thread that joined shared it.
            // A request arriving just after this sees a warm cache anyway.
            inFlight.remove(key, future);
        }
    }

    private HistoryResponse load(String symbol, Interval interval, String range, String key) {
        long now = clock.instant().getEpochSecond();
        Optional<CachedSeries> cached = cache.read(key);
        Duration ttl = ttlFor(interval);

        if (cached.isPresent() && now - cached.get().fetchedAt() < ttl.toSeconds()) {
            return toResponse(cached.get(), true, false);
        }

        try {
            ProviderSeries series = fetchNormalised(symbol, interval, range);
            CachedSeries entry = new CachedSeries(key, symbol, interval.code(), range,
                    series.currency(), series.exchange(), now, series.bars());
            cache.write(entry);
            return toResponse(entry, false, false);
        } catch (ApiException e) {
            // Out-of-date bars still teach the same lesson; an error page teaches nothing. Only
            // upstream faults qualify — a bad request is the caller's to fix and must still fail.
            if (e.isUpstreamFault() && cached.isPresent()) {
                log.warn("Serving stale cache for {} after upstream failure: {}", key, e.getMessage());
                return toResponse(cached.get(), true, true);
            }
            throw e;
        }
    }

    private ProviderSeries fetchNormalised(String symbol, Interval interval, String range) {
        ProviderSeries raw = provider.fetch(symbol, interval.upstream(), range);
        List<Bar> bars = Bars.normalize(raw.bars());
        if (interval == Interval.H4) {
            bars = Bars.toFourHour(bars);
        }
        if (bars.isEmpty()) {
            throw ApiException.noData(
                    "The market data provider returned no usable bars for " + symbol + ".");
        }
        return raw.withBars(bars);
    }

    private HistoryResponse toResponse(CachedSeries entry, boolean cached, boolean stale) {
        return new HistoryResponse(entry.symbol(), entry.interval(), entry.currency(),
                entry.exchange(), entry.bars(), provider.name(), entry.fetchedAt(), cached, stale);
    }

    private Duration ttlFor(Interval interval) {
        TradeLabProperties.Cache c = properties.cache();
        return switch (interval.ttlBucket()) {
            case INTRADAY -> c.intradayTtl();
            case HOURLY -> c.hourlyTtl();
            case DAILY -> c.dailyTtl();
        };
    }

    private static RuntimeException unwrap(CompletionException e) {
        Throwable cause = e.getCause();
        if (cause instanceof ApiException api) {
            return api;
        }
        if (cause instanceof RuntimeException re) {
            return re;
        }
        return ApiException.upstreamFailed("The market data request could not be completed.", cause);
    }

    /** Exposed for {@code /api/health}; the cache is otherwise entirely internal. */
    public DiskCache cache() {
        return cache;
    }
}
