package com.terala.tradelab.web;

import com.terala.tradelab.config.TradeLabProperties;
import com.terala.tradelab.dto.HealthResponse;
import com.terala.tradelab.dto.HistoryResponse;
import com.terala.tradelab.dto.SymbolsResponse;
import com.terala.tradelab.market.MarketDataService;
import com.terala.tradelab.market.SymbolCatalog;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * The whole public surface: three read-only GETs. There is nothing to POST — this service owns
 * no state beyond a cache it can rebuild.
 */
@RestController
@RequestMapping("/api")
public class MarketDataController {

    private final MarketDataService service;
    private final TradeLabProperties properties;

    public MarketDataController(MarketDataService service, TradeLabProperties properties) {
        this.service = service;
        this.properties = properties;
    }

    /** Used by the browser to decide whether real-data mode is even offerable. */
    @GetMapping("/health")
    public HealthResponse health() {
        return new HealthResponse(true, properties.version(), service.providerName(),
                service.cache().stats());
    }

    @GetMapping("/symbols")
    public SymbolsResponse symbols() {
        return new SymbolsResponse(SymbolCatalog.all());
    }

    @GetMapping("/history")
    public HistoryResponse history(
            @RequestParam String symbol,
            @RequestParam String interval,
            @RequestParam(required = false) String range) {
        return service.history(symbol, interval, range);
    }
}
