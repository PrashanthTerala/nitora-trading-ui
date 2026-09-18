package com.terala.tradelab.market;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Turning provider output into bars the simulator can trust.
 *
 * <p>Real feeds are messier than they look. The same timestamp can appear twice when a bar is
 * revised, rows arrive out of order after a backfill, and an occasional row has a high below
 * its own open. The chart and the fill engine both assume strictly increasing time and a
 * consistent high/low, so everything is fixed here once rather than defended against in ten
 * places downstream.
 */
public final class Bars {

    /** Six decimals is past the tick size of every instrument we serve; it only strips float noise. */
    private static final double ROUND_SCALE = 1_000_000d;

    private Bars() {
    }

    /**
     * Sort ascending, drop unusable rows, collapse duplicate timestamps and clamp each bar so
     * high/low actually bracket open/close.
     *
     * @return a new list; the input is not modified
     */
    public static List<Bar> normalize(List<Bar> raw) {
        if (raw == null || raw.isEmpty()) {
            return List.of();
        }
        List<Bar> sorted = new ArrayList<>(raw.size());
        for (Bar b : raw) {
            if (b != null && isUsable(b)) {
                sorted.add(b);
            }
        }
        sorted.sort(Comparator.comparingLong(Bar::time));

        List<Bar> out = new ArrayList<>(sorted.size());
        for (Bar b : sorted) {
            Bar clamped = clamp(b);
            // A repeated timestamp means the provider revised that bar; the later row wins.
            if (!out.isEmpty() && out.get(out.size() - 1).time() == clamped.time()) {
                out.set(out.size() - 1, clamped);
            } else {
                out.add(clamped);
            }
        }
        return List.copyOf(out);
    }

    /**
     * Build 4-hour bars from 1-hour ones. Buckets are floored on the unix epoch, which lands
     * them on 00:00, 04:00, 08:00 ... UTC because 14400 divides a day exactly. Aligning to UTC
     * rather than to the first bar keeps the buckets identical no matter where the window starts,
     * so a cached 4h series and a freshly fetched one agree.
     *
     * @param hourly bars that have already been through {@link #normalize}
     */
    public static List<Bar> toFourHour(List<Bar> hourly) {
        if (hourly == null || hourly.isEmpty()) {
            return List.of();
        }
        long width = Interval.H4.seconds();
        List<Bar> out = new ArrayList<>();

        long bucket = Long.MIN_VALUE;
        double open = 0, high = 0, low = 0, close = 0;
        long volume = 0;

        for (Bar b : hourly) {
            long start = Math.floorDiv(b.time(), width) * width;
            if (start != bucket) {
                if (bucket != Long.MIN_VALUE) {
                    out.add(new Bar(bucket, open, high, low, close, volume));
                }
                bucket = start;
                open = b.open();
                high = b.high();
                low = b.low();
                volume = 0;
            } else {
                high = Math.max(high, b.high());
                low = Math.min(low, b.low());
            }
            close = b.close();
            volume += b.volume();
        }
        out.add(new Bar(bucket, open, high, low, close, volume));
        return List.copyOf(out);
    }

    private static boolean isUsable(Bar b) {
        return isFinite(b.open()) && isFinite(b.high()) && isFinite(b.low()) && isFinite(b.close());
    }

    private static boolean isFinite(double v) {
        return !Double.isNaN(v) && !Double.isInfinite(v);
    }

    private static Bar clamp(Bar b) {
        double open = round(b.open());
        double close = round(b.close());
        double high = Math.max(round(b.high()), Math.max(open, close));
        double low = Math.min(round(b.low()), Math.min(open, close));
        long volume = Math.max(0L, b.volume());
        return new Bar(b.time(), open, high, low, close, volume);
    }

    private static double round(double v) {
        return Math.round(v * ROUND_SCALE) / ROUND_SCALE;
    }
}
