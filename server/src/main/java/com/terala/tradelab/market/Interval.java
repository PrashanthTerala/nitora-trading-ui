package com.terala.tradelab.market;

import java.util.Locale;

import com.terala.tradelab.error.ApiException;

/**
 * The intervals the simulator can replay, plus how far back each one may reasonably go.
 *
 * <p>The day limits are not ours: they are what the upstream chart endpoint will actually
 * serve for that resolution. Asking for more does not fail loudly, it just silently returns
 * less, so we cap the request ourselves and stay honest about what we asked for.
 */
public enum Interval {

    M1("1m", 7, TtlBucket.INTRADAY),
    M5("5m", 60, TtlBucket.INTRADAY),
    M15("15m", 60, TtlBucket.INTRADAY),
    H1("1h", 730, TtlBucket.HOURLY),
    /** The provider has no 4h resolution; we fetch 1h and aggregate, so the limit is 1h's. */
    H4("4h", 730, TtlBucket.HOURLY),
    D1("1d", 3650, TtlBucket.DAILY);

    public enum TtlBucket { INTRADAY, HOURLY, DAILY }

    private final String code;
    private final int maxDays;
    private final TtlBucket ttlBucket;

    Interval(String code, int maxDays, TtlBucket ttlBucket) {
        this.code = code;
        this.maxDays = maxDays;
        this.ttlBucket = ttlBucket;
    }

    public String code() {
        return code;
    }

    public int maxDays() {
        return maxDays;
    }

    public TtlBucket ttlBucket() {
        return ttlBucket;
    }

    /** The resolution actually requested upstream: 4h does not exist, so it rides on 1h. */
    public Interval upstream() {
        return this == H4 ? H1 : this;
    }

    /** Whole seconds per bar. Only meaningful for fixed-width intervals (all of ours are). */
    public long seconds() {
        return switch (this) {
            case M1 -> 60L;
            case M5 -> 300L;
            case M15 -> 900L;
            case H1 -> 3600L;
            case H4 -> 14400L;
            case D1 -> 86400L;
        };
    }

    public static Interval fromCode(String raw) {
        if (raw != null) {
            String wanted = raw.trim().toLowerCase(Locale.ROOT);
            for (Interval i : values()) {
                if (i.code.equals(wanted)) {
                    return i;
                }
            }
        }
        throw ApiException.badRequest(
                "Unknown interval '" + raw + "'. Use one of 1m, 5m, 15m, 1h, 4h, 1d.");
    }

    /**
     * Normalise the caller's range to something the provider accepts, never exceeding what
     * this interval supports. An over-long request is capped rather than rejected: the
     * caller asked for "as much as possible" and that is what they get.
     *
     * @param raw the requested range, or null/blank for this interval's maximum
     */
    public String capRange(String raw) {
        int days = (raw == null || raw.isBlank()) ? maxDays : parseDays(raw);
        return canonicalRange(Math.min(days, maxDays));
    }

    /** Parse "7d", "6mo", "2y", "max" into whole days. */
    static int parseDays(String raw) {
        String s = raw.trim().toLowerCase(Locale.ROOT);
        if (s.equals("max")) {
            return Integer.MAX_VALUE;
        }
        String unit;
        if (s.endsWith("mo")) {
            unit = "mo";
        } else if (s.endsWith("d") || s.endsWith("w") || s.endsWith("y")) {
            unit = s.substring(s.length() - 1);
        } else {
            throw ApiException.badRequest(
                    "Unknown range '" + raw + "'. Use a form like 7d, 60d, 6mo, 2y or max.");
        }
        long n;
        try {
            n = Long.parseLong(s.substring(0, s.length() - unit.length()));
        } catch (NumberFormatException e) {
            throw ApiException.badRequest(
                    "Unknown range '" + raw + "'. Use a form like 7d, 60d, 6mo, 2y or max.");
        }
        if (n <= 0) {
            throw ApiException.badRequest("Range '" + raw + "' must be a positive amount of time.");
        }
        long days = switch (unit) {
            case "d" -> n;
            case "w" -> n * 7;
            case "mo" -> n * 30;
            default -> n * 365;
        };
        return (int) Math.min(days, Integer.MAX_VALUE);
    }

    /**
     * Render whole days back into a range token. Beyond two years the provider is happier
     * with a year token than a four-digit day count, so prefer years where it divides evenly.
     */
    static String canonicalRange(int days) {
        if (days > 730 && days % 365 == 0) {
            return (days / 365) + "y";
        }
        return days + "d";
    }
}
