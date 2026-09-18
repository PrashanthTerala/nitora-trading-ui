package com.terala.tradelab.market;

import com.terala.tradelab.dto.SymbolInfo;
import com.terala.tradelab.error.ApiException;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.http.HttpStatus;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * The symbol is the only caller input that reaches an upstream URL path and a filename, so this
 * is the security boundary of the service, not a formatting nicety.
 */
class SymbolValidatorTest {

    @ParameterizedTest
    @ValueSource(strings = {"AAPL", "aapl", "BRK.B", "^GSPC", "BTC-USD", "EURUSD=X", "A", "ES=F"})
    void acceptsRealTickers(String symbol) {
        assertThat(SymbolValidator.isValid(symbol)).isTrue();
    }

    @Test
    void upperCasesSoCacheKeysAgree() {
        assertThat(SymbolValidator.normalize("btc-usd")).isEqualTo("BTC-USD");
        assertThat(SymbolValidator.normalize("AAPL")).isEqualTo("AAPL");
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "../../etc/passwd",
            "..",
            "AAPL/../../v8",
            "AAPL%2F..",
            "AAPL\\..\\x",
            "/absolute",
            "C:\\Windows",
            "AAPL?range=1d",
            "AAPL&interval=1m",
            "AAPL#frag",
            "AAPL AAPL",
            "AAPL\nHost: evil",
            "AAPL\u0000",
            "<script>",
            "$(whoami)",
            "http://evil.test/x"})
    @DisplayName("path traversal, injection and URL-ish input are rejected outright")
    void rejectsDangerousInput(String symbol) {
        assertThat(SymbolValidator.isValid(symbol)).isFalse();
        assertThatThrownBy(() -> SymbolValidator.normalize(symbol))
                .isInstanceOf(ApiException.class)
                .extracting(e -> ((ApiException) e).status())
                .isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    @DisplayName("an over-long symbol is rejected: no real ticker needs sixteen characters")
    void rejectsOverLongSymbols() {
        assertThat(SymbolValidator.isValid("ABCDEFGHIJKLMNO")).isTrue();      // 15, the limit
        assertThat(SymbolValidator.isValid("ABCDEFGHIJKLMNOP")).isFalse();    // 16
        assertThat(SymbolValidator.isValid("A".repeat(4096))).isFalse();
    }

    @Test
    void rejectsEmptyAndNull() {
        assertThat(SymbolValidator.isValid("")).isFalse();
        assertThat(SymbolValidator.isValid(null)).isFalse();
    }

    @Test
    @DisplayName("every curated symbol passes its own validator")
    void catalogIsSelfConsistent() {
        assertThat(SymbolCatalog.all()).hasSizeBetween(12, 16);
        for (SymbolInfo s : SymbolCatalog.all()) {
            assertThat(SymbolValidator.isValid(s.symbol()))
                    .as("catalog symbol %s", s.symbol()).isTrue();
            assertThat(s.name()).isNotBlank();
            assertThat(s.description()).isNotBlank();
            assertThat(s.unitLabel()).isNotBlank();
            assertThat(s.decimals()).isBetween(0, 8);
            assertThat(s.kind()).isIn("stock", "index", "metal", "crypto", "energy", "biotech", "forex");
        }
        assertThat(SymbolCatalog.all()).extracting(SymbolInfo::symbol).doesNotHaveDuplicates();
        // The teaching range is the point of the list: losing a whole asset class is a bug.
        assertThat(SymbolCatalog.all()).extracting(SymbolInfo::kind)
                .contains("stock", "index", "metal", "crypto", "energy", "biotech", "forex");
    }
}
