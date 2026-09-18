package com.terala.tradelab.provider;

import java.util.concurrent.locks.LockSupport;

/**
 * Spaces outgoing upstream calls so we are a polite client of an endpoint that owes us nothing.
 *
 * <p>Reservation-based rather than sleep-while-holding-the-lock: a caller claims the next slot
 * under the monitor, releases it, and only then parks. Ten threads therefore queue up in order
 * instead of serialising all their work behind one sleeping thread.
 */
public final class RateLimiter {

    private final long spacingNanos;
    private long nextSlotNanos;

    public RateLimiter(int permitsPerSecond) {
        if (permitsPerSecond <= 0) {
            throw new IllegalArgumentException("permitsPerSecond must be positive");
        }
        this.spacingNanos = 1_000_000_000L / permitsPerSecond;
        this.nextSlotNanos = System.nanoTime();
    }

    public void acquire() {
        long waitNanos;
        synchronized (this) {
            long now = System.nanoTime();
            // nanoTime is monotonic but our reservation can fall behind after an idle period.
            if (nextSlotNanos - now < 0) {
                nextSlotNanos = now;
            }
            waitNanos = nextSlotNanos - now;
            nextSlotNanos += spacingNanos;
        }
        if (waitNanos > 0) {
            LockSupport.parkNanos(waitNanos);
        }
    }
}
