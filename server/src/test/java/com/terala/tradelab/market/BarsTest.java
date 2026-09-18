package com.terala.tradelab.market;

import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Normalisation is the contract the whole front end leans on: strictly increasing time, no
 * duplicates, and a high/low that actually brackets the body. Every case here has been seen in
 * real provider output.
 */
class BarsTest {

    @Test
    @DisplayName("out-of-order bars are sorted ascending by time")
    void sortsAscending() {
        List<Bar> out = Bars.normalize(List.of(
                bar(300, 10, 11, 9, 10.5),
                bar(100, 8, 9, 7, 8.5),
                bar(200, 9, 10, 8, 9.5)));

        assertThat(out).extracting(Bar::time).containsExactly(100L, 200L, 300L);
    }

    @Test
    @DisplayName("time is strictly increasing after normalisation")
    void timeIsStrictlyIncreasing() {
        List<Bar> out = Bars.normalize(List.of(
                bar(100, 1, 2, 0.5, 1.5),
                bar(100, 1, 2, 0.5, 1.6),
                bar(200, 2, 3, 1.5, 2.5),
                bar(200, 2, 3, 1.5, 2.6),
                bar(150, 1.5, 2.5, 1, 2)));

        for (int i = 1; i < out.size(); i++) {
            assertThat(out.get(i).time()).isGreaterThan(out.get(i - 1).time());
        }
    }

    @Test
    @DisplayName("a repeated timestamp keeps the later row, because providers revise bars")
    void duplicatesCollapseToTheRevision() {
        List<Bar> out = Bars.normalize(List.of(
                bar(100, 1, 2, 0.5, 1.5),
                bar(100, 1, 2, 0.5, 1.9)));

        assertThat(out).hasSize(1);
        assertThat(out.get(0).close()).isEqualTo(1.9);
    }

    @Test
    @DisplayName("rows carrying NaN or infinite prices are dropped, not repaired")
    void dropsUnusableRows() {
        List<Bar> raw = new ArrayList<>();
        raw.add(bar(100, 1, 2, 0.5, 1.5));
        raw.add(bar(200, Double.NaN, 2, 0.5, 1.5));
        raw.add(bar(300, 1, Double.POSITIVE_INFINITY, 0.5, 1.5));
        raw.add(bar(400, 1, 2, Double.NaN, 1.5));
        raw.add(bar(500, 1, 2, 0.5, Double.NaN));
        raw.add(bar(600, 2, 3, 1, 2.5));
        raw.add(null);

        assertThat(Bars.normalize(raw)).extracting(Bar::time).containsExactly(100L, 600L);
    }

    @Test
    @DisplayName("a high below the body is raised and a low above it is lowered")
    void clampsInconsistentHighAndLow() {
        // A real row from a thinly traded minute: the high is below the close it reports.
        Bar out = Bars.normalize(List.of(bar(100, 10, 9.5, 10.2, 11))).get(0);

        assertThat(out.high()).isEqualTo(11.0);
        assertThat(out.low()).isEqualTo(10.0);
        assertThat(out.high()).isGreaterThanOrEqualTo(Math.max(out.open(), out.close()));
        assertThat(out.low()).isLessThanOrEqualTo(Math.min(out.open(), out.close()));
    }

    @Test
    @DisplayName("a consistent bar is left alone")
    void leavesGoodBarsUntouched() {
        Bar in = bar(100, 10, 12, 9, 11);
        assertThat(Bars.normalize(List.of(in))).containsExactly(in);
    }

    @Test
    @DisplayName("negative volume is floored at zero")
    void floorsNegativeVolume() {
        Bar out = Bars.normalize(List.of(new Bar(100, 1, 2, 0.5, 1.5, -5))).get(0);
        assertThat(out.volume()).isZero();
    }

    @Test
    void emptyAndNullInputProduceAnEmptyList() {
        assertThat(Bars.normalize(null)).isEmpty();
        assertThat(Bars.normalize(List.of())).isEmpty();
    }

    private static Bar bar(long time, double open, double high, double low, double close) {
        return new Bar(time, open, high, low, close, 1000);
    }
}
