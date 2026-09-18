package com.terala.tradelab.dto;

public record HealthResponse(boolean ok, String version, String provider, CacheStats cache) {

    /** Enough for an operator to see the disk cache is working without opening the folder. */
    public record CacheStats(int entries, long bytes) {
    }
}
