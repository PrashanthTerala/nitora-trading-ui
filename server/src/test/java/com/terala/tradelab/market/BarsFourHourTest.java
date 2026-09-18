package com.terala.tradelab.market;

import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The provider has no 4h resolution, so we build it. Getting the bucket boundaries wrong would
 * be invisible on a chart but would quietly shift every signal a learner is taught to read, so
 * the arithmetic is pinned down here with hand-computed numbers.
 */
class BarsFourHourTest {

    /** 2024-01-02T00:00:00Z — deliberately a 4-hour boundary. */
    private static final long MIDNIGHT_UTC = 1704153600L;

    @Test
    @DisplayName("eight hourly bars become two 4h bars with the right OHLCV")
    void aggregatesEightHoursIntoTwoBars() {
        List<Bar> hourly = new ArrayList<>();
        for (int i = 0; i < 8; i++) {
            hourly.add(new Bar(MIDNIGHT_UTC + i * 3600L,
                    100 + i, 102 + i, 99 + i, 100.5 + i, 10L * (i + 1)));
        }

        List<Bar> out = Bars.toFourHour(hourly);

        assertThat(out).hasSize(2);

        Bar first = out.get(0);
        assertThat(first.time()).isEqualTo(MIDNIGHT_UTC);
        assertThat(first.open()).isEqualTo(100.0);    // open of the 00:00 bar
        assertThat(first.high()).isEqualTo(105.0);    // highest of 102,103,104,105
        assertThat(first.low()).isEqualTo(99.0);      // lowest of 99,100,101,102
        assertThat(first.close()).isEqualTo(103.5);   // close of the 03:00 bar
        assertThat(first.volume()).isEqualTo(100L);   // 10+20+30+40

        Bar second = out.get(1);
        assertThat(second.time()).isEqualTo(MIDNIGHT_UTC + 14400L);
        assertThat(second.open()).isEqualTo(104.0);
        assertThat(second.high()).isEqualTo(109.0);
        assertThat(second.low()).isEqualTo(103.0);
        assertThat(second.close()).isEqualTo(107.5);
        assertThat(second.volume()).isEqualTo(260L);  // 50+60+70+80
    }

    @Test
    @DisplayName("buckets are spaced exactly four hours apart")
    void bucketsAreFourHoursApart() {
        List<Bar> hourly = new ArrayList<>();
        for (int i = 0; i < 24; i++) {
            hourly.add(new Bar(MIDNIGHT_UTC + i * 3600L, 10, 11, 9, 10.5, 1));
        }

        List<Bar> out = Bars.toFourHour(hourly);

        assertThat(out).hasSize(6);
        for (int i = 1; i < out.size(); i++) {
            assertThat(out.get(i).time() - out.get(i - 1).time()).isEqualTo(14400L);
        }
    }

    @Test
    @DisplayName("buckets snap to UTC wall-clock boundaries, not to the first bar")
    void alignsToUtcNotToTheFirstBar() {
        // Series starts at 02:00, in the middle of the 00:00-04:00 bucket.
        List<Bar> hourly = List.of(
                new Bar(MIDNIGHT_UTC + 2 * 3600L, 10, 11, 9, 10.5, 1),
                new Bar(MIDNIGHT_UTC + 3 * 3600L, 10.5, 12, 10, 11.5, 2),
                new Bar(MIDNIGHT_UTC + 4 * 3600L, 11.5, 13, 11, 12.5, 3));

        List<Bar> out = Bars.toFourHour(hourly);

        assertThat(out).hasSize(2);
        assertThat(out.get(0).time()).isEqualTo(MIDNIGHT_UTC);
        assertThat(out.get(0).open()).isEqualTo(10.0);
        assertThat(out.get(0).volume()).isEqualTo(3L);
        assertThat(out.get(1).time()).isEqualTo(MIDNIGHT_UTC + 14400L);

        for (Bar b : out) {
            assertThat(Instant.ofEpochSecond(b.time()).atZone(ZoneOffset.UTC).getHour() % 4).isZero();
            assertThat(Instant.ofEpochSecond(b.time()).atZone(ZoneOffset.UTC).getMinute()).isZero();
        }
    }

    @Test
    @DisplayName("a gap in the hourly data does not invent empty buckets")
    void skipsBucketsWithNoData() {
        List<Bar> hourly = List.of(
                new Bar(MIDNIGHT_UTC, 10, 11, 9, 10.5, 1),
                // ...twelve hours of nothing (a weekend, a halt)...
                new Bar(MIDNIGHT_UTC + 12 * 3600L, 20, 21, 19, 20.5, 2));

        List<Bar> out = Bars.toFourHour(hourly);

        assertThat(out).extracting(Bar::time)
                .containsExactly(MIDNIGHT_UTC, MIDNIGHT_UTC + 12 * 3600L);
    }

    @Test
    @DisplayName("a trailing partial bucket is still emitted")
    void emitsTrailingPartialBucket() {
        List<Bar> hourly = List.of(
                new Bar(MIDNIGHT_UTC, 10, 11, 9, 10.5, 1),
                new Bar(MIDNIGHT_UTC + 3600L, 10.5, 12, 10, 11.5, 2),
                new Bar(MIDNIGHT_UTC + 14400L, 11.5, 13, 11, 12.5, 4));

        List<Bar> out = Bars.toFourHour(hourly);

        assertThat(out).hasSize(2);
        assertThat(out.get(1).open()).isEqualTo(11.5);
        assertThat(out.get(1).close()).isEqualTo(12.5);
        assertThat(out.get(1).volume()).isEqualTo(4L);
    }

    @Test
    void emptyInputProducesNoBars() {
        assertThat(Bars.toFourHour(List.of())).isEmpty();
        assertThat(Bars.toFourHour(null)).isEmpty();
    }
}
