package com.terala.tradelab.market;

import java.util.List;

import com.terala.tradelab.dto.SymbolInfo;

/**
 * The instruments offered in real-data mode.
 *
 * <p>This is static configuration, not a provider lookup, and deliberately so: the point of the
 * list is teaching coverage, not completeness. It mirrors the personalities of the synthetic
 * instruments — something calm, something violent, an index, a metal, a crypto pair, an energy
 * name, an event-driven biotech and a currency pair — so a learner meets the same range of
 * market behaviour whichever mode they are in. Fetching a 10,000-ticker list would also mean
 * shipping a second upstream dependency for no teaching benefit.
 */
public final class SymbolCatalog {

    private static final List<SymbolInfo> SYMBOLS = List.of(
            new SymbolInfo("AAPL", "Apple Inc.", "stock", 2, "shares",
                    "A mega-cap tech name: deep liquidity and clean, readable trends, which makes it the gentlest place to start."),
            new SymbolInfo("MSFT", "Microsoft Corp.", "stock", 2, "shares",
                    "Another mega-cap, but a steadier one than Apple: good for seeing how the same setup pays differently in a slower stock."),
            new SymbolInfo("NVDA", "NVIDIA Corp.", "stock", 2, "shares",
                    "Violent momentum and huge earnings gaps: the best lesson in why chasing a vertical move is expensive."),
            new SymbolInfo("TSLA", "Tesla Inc.", "stock", 2, "shares",
                    "High-volatility growth with sharp reversals; excellent for practising stop placement that survives noise."),
            new SymbolInfo("KO", "Coca-Cola Co.", "stock", 2, "shares",
                    "A calm blue chip with small candles and slow trends: the kindest chart for learning to read price without adrenaline."),
            new SymbolInfo("JNJ", "Johnson & Johnson", "stock", 2, "shares",
                    "Defensive and low-beta, so it drifts while the market panics: useful for seeing what correlation actually looks like."),
            new SymbolInfo("SPY", "SPDR S&P 500 ETF", "index", 2, "shares",
                    "The broad market itself: smooth trends punctuated by sharp sell-offs, and the backdrop every other chart trades against."),
            new SymbolInfo("QQQ", "Invesco QQQ Trust", "index", 2, "shares",
                    "The tech-heavy index: the same shape as SPY with the volatility turned up, which shows how beta changes position sizing."),
            new SymbolInfo("GLD", "SPDR Gold Shares", "metal", 2, "shares",
                    "Gold: long mean-reverting ranges broken by grinding trends, ideal for range trading and Bollinger practice."),
            new SymbolInfo("BTC-USD", "Bitcoin / US Dollar", "crypto", 0, "coins",
                    "Trades every hour of every day, so there are no gaps but no rest either: brutal volatility and long wicks."),
            new SymbolInfo("ETH-USD", "Ethereum / US Dollar", "crypto", 2, "coins",
                    "Moves with Bitcoin but harder; a live demonstration of correlated risk when you hold both at once."),
            new SymbolInfo("XOM", "Exxon Mobil Corp.", "energy", 2, "shares",
                    "Oil-linked and strongly trending on supply shocks: a natural home for trend-following rules."),
            new SymbolInfo("USO", "United States Oil Fund", "energy", 2, "shares",
                    "Tracks crude itself rather than a company, so the commodity's shocks arrive undiluted by an earnings cycle."),
            new SymbolInfo("MRNA", "Moderna Inc.", "biotech", 2, "shares",
                    "Quiet drift punctuated by enormous trial-result gaps: the clearest lesson in event risk and why a stop can be jumped."),
            new SymbolInfo("EURUSD=X", "Euro / US Dollar", "forex", 4, "units",
                    "Moves in pips inside tight ranges, so trends only become visible on higher timeframes: it teaches patience and scale."));

    private SymbolCatalog() {
    }

    public static List<SymbolInfo> all() {
        return SYMBOLS;
    }
}
