package com.terala.tradelab.market;

import com.terala.tradelab.error.ApiException;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.http.HttpStatus;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class IntervalTest {

    @ParameterizedTest
    @CsvSource({"1m,M1", "5m,M5", "15m,M15", "1h,H1", "4h,H4", "1d,D1", "1D,D1"})
    void parsesEveryPublishedInterval(String code, Interval expected) {
        assertThat(Interval.fromCode(code)).isEqualTo(expected);
    }

    @Test
    void toleratesSurroundingWhitespace() {
        assertThat(Interval.fromCode("  1h  ")).isEqualTo(Interval.H1);
        assertThat(Interval.D1.capRange("  5y ")).isEqualTo("5y");
    }

    @ParameterizedTest
    @CsvSource({"1w", "30m", "'2d'", "''", "1mo"})
    @DisplayName("an interval we do not serve is a 400, not a guess")
    void rejectsUnknownIntervals(String code) {
        assertThatThrownBy(() -> Interval.fromCode(code))
                .isInstanceOf(ApiException.class)
                .extracting(e -> ((ApiException) e).status())
                .isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void rejectsNullInterval() {
        assertThatThrownBy(() -> Interval.fromCode(null)).isInstanceOf(ApiException.class);
    }

    @Test
    @DisplayName("omitting the range gives the most history that interval supports")
    void defaultRangeIsTheMaximum() {
        assertThat(Interval.M1.capRange(null)).isEqualTo("7d");
        assertThat(Interval.M5.capRange(null)).isEqualTo("60d");
        assertThat(Interval.M15.capRange("")).isEqualTo("60d");
        assertThat(Interval.H1.capRange(null)).isEqualTo("730d");
        assertThat(Interval.H4.capRange(null)).isEqualTo("730d");
        assertThat(Interval.D1.capRange(null)).isEqualTo("10y");
    }

    @Test
    @DisplayName("an over-long range is silently capped rather than rejected")
    void capsOverLongRanges() {
        // "give me ten years of one-minute bars" is a reasonable thing to ask and an
        // impossible thing to serve; the caller gets the seven days that exist.
        assertThat(Interval.M1.capRange("10y")).isEqualTo("7d");
        assertThat(Interval.M5.capRange("5y")).isEqualTo("60d");
        assertThat(Interval.M15.capRange("max")).isEqualTo("60d");
        assertThat(Interval.H1.capRange("10y")).isEqualTo("730d");
        assertThat(Interval.H4.capRange("20y")).isEqualTo("730d");
        assertThat(Interval.D1.capRange("50y")).isEqualTo("10y");
    }

    @Test
    @DisplayName("a range inside the limit is passed through")
    void keepsRangesWithinTheLimit() {
        assertThat(Interval.M1.capRange("3d")).isEqualTo("3d");
        assertThat(Interval.M5.capRange("30d")).isEqualTo("30d");
        assertThat(Interval.D1.capRange("1y")).isEqualTo("365d");
        assertThat(Interval.D1.capRange("5y")).isEqualTo("5y");
        assertThat(Interval.H1.capRange("6mo")).isEqualTo("180d");
        assertThat(Interval.M15.capRange("2w")).isEqualTo("14d");
    }

    @Test
    @DisplayName("the 4h interval rides on 1h because no provider serves it natively")
    void fourHourFetchesHourly() {
        assertThat(Interval.H4.upstream()).isEqualTo(Interval.H1);
        assertThat(Interval.H4.seconds()).isEqualTo(14400L);
        for (Interval i : Interval.values()) {
            if (i != Interval.H4) {
                assertThat(i.upstream()).isEqualTo(i);
            }
        }
    }

    @ParameterizedTest
    @CsvSource({"7", "abc", "-5d", "0d", "7days", "d"})
    void rejectsMalformedRanges(String range) {
        assertThatThrownBy(() -> Interval.D1.capRange(range))
                .isInstanceOf(ApiException.class)
                .extracting(e -> ((ApiException) e).status())
                .isEqualTo(HttpStatus.BAD_REQUEST);
    }
}
