package com.terala.tradelab.provider;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.terala.tradelab.error.ApiException;
import com.terala.tradelab.market.Bar;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Parses fixtures shaped exactly like real chart payloads. No network: the point is to pin down
 * how we react to the payload's quirks, and a live endpoint would make that untestable.
 */
class YahooChartParserTest {

    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    @DisplayName("a clean payload becomes bars plus currency and exchange")
    void parsesACleanPayload() {
        String json = """
                {"chart":{"result":[{
                  "meta":{"currency":"USD","exchangeName":"NasdaqGS","symbol":"AAPL"},
                  "timestamp":[1700000000,1700000060,1700000120],
                  "indicators":{"quote":[{
                    "open":[1.0,2.0,3.0],
                    "high":[1.5,2.5,3.5],
                    "low":[0.5,1.5,2.5],
                    "close":[1.2,2.2,3.2],
                    "volume":[100,200,300]}]}}],
                 "error":null}}
                """;

        ProviderSeries series = YahooChartParser.parse(mapper, "AAPL", json);

        assertThat(series.currency()).isEqualTo("USD");
        assertThat(series.exchange()).isEqualTo("NasdaqGS");
        assertThat(series.bars()).hasSize(3);
        assertThat(series.bars().get(0))
                .isEqualTo(new Bar(1700000000L, 1.0, 1.5, 0.5, 1.2, 100L));
    }

    @Test
    @DisplayName("rows where any price is null are dropped, not carried forward")
    void dropsRowsWithNullPrices() {
        // Halted minutes and pre-market gaps arrive as nulls in the middle of the arrays.
        String json = """
                {"chart":{"result":[{
                  "meta":{"currency":"USD","exchangeName":"NasdaqGS"},
                  "timestamp":[100,200,300,400,500],
                  "indicators":{"quote":[{
                    "open":[1.0,null,3.0,4.0,5.0],
                    "high":[1.5,2.5,null,4.5,5.5],
                    "low":[0.5,1.5,2.5,null,4.5],
                    "close":[1.2,2.2,3.2,4.2,null],
                    "volume":[10,20,30,40,50]}]}}],
                 "error":null}}
                """;

        ProviderSeries series = YahooChartParser.parse(mapper, "AAPL", json);

        assertThat(series.bars()).extracting(Bar::time).containsExactly(100L);
    }

    @Test
    @DisplayName("a null volume alongside real prices keeps the bar, with volume zero")
    void nullVolumeDoesNotDropTheBar() {
        String json = """
                {"chart":{"result":[{
                  "meta":{"currency":"USD","exchangeName":"CCY"},
                  "timestamp":[100],
                  "indicators":{"quote":[{
                    "open":[1.0],"high":[1.5],"low":[0.5],"close":[1.2],"volume":[null]}]}}],
                 "error":null}}
                """;

        assertThat(YahooChartParser.parse(mapper, "EURUSD=X", json).bars())
                .containsExactly(new Bar(100L, 1.0, 1.5, 0.5, 1.2, 0L));
    }

    @Test
    @DisplayName("price arrays shorter than the timestamp array do not blow up")
    void toleratesRaggedArrays() {
        String json = """
                {"chart":{"result":[{
                  "meta":{"currency":"USD","exchangeName":"NasdaqGS"},
                  "timestamp":[100,200,300],
                  "indicators":{"quote":[{
                    "open":[1.0,2.0],"high":[1.5,2.5],"low":[0.5,1.5],"close":[1.2,2.2],
                    "volume":[10]}]}}],
                 "error":null}}
                """;

        ProviderSeries series = YahooChartParser.parse(mapper, "AAPL", json);

        assertThat(series.bars()).extracting(Bar::time).containsExactly(100L, 200L);
        assertThat(series.bars().get(1).volume()).isZero();
    }

    @Test
    @DisplayName("an unknown ticker is the caller's mistake: 404, not 502")
    void providerNotFoundBecomes404() {
        String json = """
                {"chart":{"result":null,"error":{"code":"Not Found",
                 "description":"No data found, symbol may be delisted"}}}
                """;

        assertThatThrownBy(() -> YahooChartParser.parse(mapper, "NOPE", json))
                .isInstanceOf(ApiException.class)
                .extracting(e -> ((ApiException) e).status())
                .isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    @DisplayName("any other provider error is the provider's mistake: 502")
    void otherProviderErrorsBecome502() {
        String json = """
                {"chart":{"result":null,"error":{"code":"Unauthorized",
                 "description":"Invalid Crumb"}}}
                """;

        assertThatThrownBy(() -> YahooChartParser.parse(mapper, "AAPL", json))
                .isInstanceOf(ApiException.class)
                .extracting(e -> ((ApiException) e).status())
                .isEqualTo(HttpStatus.BAD_GATEWAY);
    }

    @Test
    @DisplayName("a valid symbol with no bars at this resolution is a 404")
    void emptyResultBecomes404() {
        assertThatThrownBy(() -> YahooChartParser.parse(mapper, "AAPL",
                """
                {"chart":{"result":[],"error":null}}"""))
                .isInstanceOf(ApiException.class)
                .extracting(e -> ((ApiException) e).status())
                .isEqualTo(HttpStatus.NOT_FOUND);

        assertThatThrownBy(() -> YahooChartParser.parse(mapper, "AAPL",
                """
                {"chart":{"result":[{"meta":{"currency":"USD"},"timestamp":[],
                 "indicators":{"quote":[{}]}}],"error":null}}"""))
                .isInstanceOf(ApiException.class)
                .extracting(e -> ((ApiException) e).status())
                .isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    @DisplayName("rows that are all null leave nothing usable: 404, not an empty 200")
    void allRowsNullBecomes404() {
        String json = """
                {"chart":{"result":[{
                  "meta":{"currency":"USD","exchangeName":"NasdaqGS"},
                  "timestamp":[100,200],
                  "indicators":{"quote":[{
                    "open":[null,null],"high":[null,null],"low":[null,null],
                    "close":[null,null],"volume":[null,null]}]}}],
                 "error":null}}
                """;

        assertThatThrownBy(() -> YahooChartParser.parse(mapper, "AAPL", json))
                .isInstanceOf(ApiException.class)
                .extracting(e -> ((ApiException) e).status())
                .isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    @DisplayName("HTML, truncated JSON or a foreign shape is a 502, never a crash")
    void unparseableBodyBecomes502() {
        for (String body : new String[]{"<html>503 Service Unavailable</html>", "{\"chart\":",
                "{\"something\":\"else\"}", "null", ""}) {
            assertThatThrownBy(() -> YahooChartParser.parse(mapper, "AAPL", body))
                    .as("body: %s", body)
                    .isInstanceOf(ApiException.class)
                    .extracting(e -> ((ApiException) e).status())
                    .isEqualTo(HttpStatus.BAD_GATEWAY);
        }
    }
}
