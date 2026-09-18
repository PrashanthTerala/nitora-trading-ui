package com.terala.tradelab.web;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.List;

import com.terala.tradelab.error.ApiException;
import com.terala.tradelab.market.Bar;
import com.terala.tradelab.market.Interval;
import com.terala.tradelab.provider.MarketDataProvider;
import com.terala.tradelab.provider.ProviderSeries;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * The wire contract, end to end through the real Spring wiring — routing, JSON field names,
 * CORS and the error advice — with only the provider replaced. The front end is already written
 * against these exact shapes, so a rename here is a broken app, not a refactor.
 */
@SpringBootTest(properties = {
        "tradelab.cache.dir=target/test-cache/api-contract",
        "tradelab.allowed-origins=http://localhost:4321"})
@AutoConfigureMockMvc
class ApiContractTest {

    private static final Path CACHE_DIR = Path.of("target/test-cache/api-contract");

    @Autowired
    MockMvc mvc;

    @MockitoBean
    MarketDataProvider provider;

    /** A cache surviving from an earlier run would silently mask upstream failures as stale hits. */
    @BeforeAll
    static void clearCache() throws IOException {
        if (Files.isDirectory(CACHE_DIR)) {
            try (var paths = Files.walk(CACHE_DIR)) {
                for (Path p : paths.sorted(Comparator.reverseOrder()).toList()) {
                    Files.deleteIfExists(p);
                }
            }
        }
    }

    @BeforeEach
    void stubProvider() {
        Mockito.when(provider.name()).thenReturn("yahoo");
    }

    // ------------------------------------------------------------------ happy paths

    @Test
    void healthReportsProviderAndCacheStats() throws Exception {
        mvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ok").value(true))
                .andExpect(jsonPath("$.version").value("1.0.0"))
                .andExpect(jsonPath("$.provider").value("yahoo"))
                .andExpect(jsonPath("$.cache.entries").isNumber())
                .andExpect(jsonPath("$.cache.bytes").isNumber());
    }

    @Test
    void symbolsReturnsTheCuratedCatalogue() throws Exception {
        mvc.perform(get("/api/symbols"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.symbols").isArray())
                .andExpect(jsonPath("$.symbols[0].symbol").isString())
                .andExpect(jsonPath("$.symbols[0].name").isString())
                .andExpect(jsonPath("$.symbols[0].kind").isString())
                .andExpect(jsonPath("$.symbols[0].decimals").isNumber())
                .andExpect(jsonPath("$.symbols[0].unitLabel").isString())
                .andExpect(jsonPath("$.symbols[0].description").isString());
    }

    @Test
    @DisplayName("history returns exactly the field names the browser reads")
    void historyMatchesTheDocumentedShape() throws Exception {
        Mockito.when(provider.fetch(eq("AAPL"), eq(Interval.D1), anyString()))
                .thenReturn(new ProviderSeries("AAPL", "USD", "NasdaqGS",
                        List.of(new Bar(1700000000L, 1.23, 1.3, 1.2, 1.28, 12345))));

        mvc.perform(get("/api/history").param("symbol", "AAPL").param("interval", "1d")
                        .param("range", "5y"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith("application/json"))
                .andExpect(jsonPath("$.symbol").value("AAPL"))
                .andExpect(jsonPath("$.interval").value("1d"))
                .andExpect(jsonPath("$.currency").value("USD"))
                .andExpect(jsonPath("$.exchange").value("NasdaqGS"))
                .andExpect(jsonPath("$.source").value("yahoo"))
                .andExpect(jsonPath("$.fetchedAt").isNumber())
                .andExpect(jsonPath("$.cached").isBoolean())
                .andExpect(jsonPath("$.stale").value(false))
                .andExpect(jsonPath("$.bars[0].time").value(1_700_000_000))
                .andExpect(jsonPath("$.bars[0].open").value(1.23))
                .andExpect(jsonPath("$.bars[0].high").value(1.3))
                .andExpect(jsonPath("$.bars[0].low").value(1.2))
                .andExpect(jsonPath("$.bars[0].close").value(1.28))
                .andExpect(jsonPath("$.bars[0].volume").value(12345));
    }

    // ------------------------------------------------------------------ error mapping

    @Test
    @DisplayName("an unknown interval is 400 with a sentence and no stack trace")
    void unknownIntervalIs400() throws Exception {
        mvc.perform(get("/api/history").param("symbol", "AAPL").param("interval", "3h"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").isString())
                .andExpect(jsonPath("$.trace").doesNotExist())
                .andExpect(jsonPath("$.exception").doesNotExist());
    }

    @Test
    void invalidSymbolIs400() throws Exception {
        mvc.perform(get("/api/history").param("symbol", "../../etc/passwd").param("interval", "1d"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").isString());
        Mockito.verify(provider, Mockito.never()).fetch(anyString(), any(), anyString());
    }

    @Test
    void missingParameterIs400() throws Exception {
        mvc.perform(get("/api/history").param("symbol", "AAPL"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").isString());
    }

    @Test
    void providerWithNoDataIs404() throws Exception {
        Mockito.when(provider.fetch(eq("ZZZZ"), any(), anyString()))
                .thenThrow(ApiException.noData("The market data provider has no data for ZZZZ."));

        mvc.perform(get("/api/history").param("symbol", "ZZZZ").param("interval", "1d"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("The market data provider has no data for ZZZZ."));
    }

    @Test
    void providerFailureIs502() throws Exception {
        Mockito.when(provider.fetch(eq("FAIL"), any(), anyString()))
                .thenThrow(ApiException.upstreamFailed("The market data provider failed.", null));

        mvc.perform(get("/api/history").param("symbol", "FAIL").param("interval", "1d"))
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.error").isString());
    }

    @Test
    void providerTimeoutIs504() throws Exception {
        Mockito.when(provider.fetch(eq("SLOW"), any(), anyString()))
                .thenThrow(ApiException.upstreamTimeout("The market data provider timed out.", null));

        mvc.perform(get("/api/history").param("symbol", "SLOW").param("interval", "1d"))
                .andExpect(status().isGatewayTimeout())
                .andExpect(jsonPath("$.error").isString());
    }

    @Test
    @DisplayName("an unexpected provider bug is a 500 sentence, never a leaked stack trace")
    void unexpectedFailureIs500WithoutDetail() throws Exception {
        Mockito.when(provider.fetch(eq("BOOM"), any(), anyString()))
                .thenThrow(new IllegalStateException("secret internal detail"));

        mvc.perform(get("/api/history").param("symbol", "BOOM").param("interval", "1d"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.error").isString())
                .andExpect(content().string(org.hamcrest.Matchers.not(
                        org.hamcrest.Matchers.containsString("secret internal detail"))));
    }

    @Test
    void unknownEndpointIs404Json() throws Exception {
        mvc.perform(get("/api/nope"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").isString());
    }

    // ------------------------------------------------------------------ CORS

    @Test
    @DisplayName("the dev servers are allowed and the origin is echoed, never wildcarded")
    void allowsConfiguredOrigins() throws Exception {
        for (String origin : List.of("http://localhost:5173", "http://localhost:5199",
                "http://localhost:4321")) {
            mvc.perform(get("/api/health").header("Origin", origin))
                    .andExpect(status().isOk())
                    .andExpect(header().string("Access-Control-Allow-Origin", origin));
        }
    }

    @Test
    void preflightSucceeds() throws Exception {
        mvc.perform(options("/api/history")
                        .header("Origin", "http://localhost:5173")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"))
                .andExpect(header().string("Access-Control-Allow-Methods",
                        org.hamcrest.Matchers.containsString("GET")));
    }

    @Test
    @DisplayName("an origin nobody configured gets no CORS grant")
    void rejectsUnknownOrigins() throws Exception {
        mvc.perform(get("/api/health").header("Origin", "http://evil.test"))
                .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
    }
}
