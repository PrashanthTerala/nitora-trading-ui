package com.terala.tradelab.dto;

/**
 * One entry of {@code GET /api/symbols}. {@code decimals} and {@code unitLabel} are the
 * simulator's formatting contract, not the provider's: the browser uses them to print prices
 * and position sizes without having to know anything about the instrument.
 */
public record SymbolInfo(
        String symbol,
        String name,
        String kind,
        int decimals,
        String unitLabel,
        String description) {
}
