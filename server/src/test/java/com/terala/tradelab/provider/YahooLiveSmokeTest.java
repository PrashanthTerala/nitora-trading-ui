package com.terala.tradelab.provider;

import java.time.Duration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.terala.tradelab.config.TradeLabProperties;
import com.terala.tradelab.market.Bar;
import com.terala.tradelab.market.Bars;
import com.terala.tradelab.market.Interval;

import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.boot.http.client.ClientHttpRequestFactoryBuilder;
import org.springframework.boot.http.client.ClientHttpRequestFactorySettings;
import org.springframework.web.client.RestClient;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Calls the real endpoint. Tagged {@code live} and excluded by the surefire configuration, so
 * {@code mvn test} stays offline and deterministic; the suite must never fail because someone's
 * wifi dropped or because an unofficial endpoint changed its mind.
 *
 * <p>Run it deliberately when you suspect the upstream shape has drifted:
 * {@code mvn test -Dgroups=live -DexcludedGroups=}
 */
@Tag("live")
class YahooLiveSmokeTest {

    @Test
    void fetchesRealDailyBarsForApple() {
        TradeLabProperties.Upstream config = new TradeLabProperties.Upstream(
                Duration.ofSeconds(15), Duration.ofSeconds(5), 5,
                "https://query1.finance.yahoo.com",
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                        + "(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36");

        RestClient client = RestClient.builder()
                .baseUrl(config.yahooBaseUrl())
                .requestFactory(ClientHttpRequestFactoryBuilder.simple()
                        .build(ClientHttpRequestFactorySettings.defaults()
                                .withConnectTimeout(config.connectTimeout())
                                .withReadTimeout(config.timeout())))
                .build();

        YahooChartProvider provider =
                new YahooChartProvider(client, new ObjectMapper(), config, new RateLimiter(5));

        ProviderSeries series = provider.fetch("AAPL", Interval.D1, "1y");

        assertThat(series.currency()).isEqualTo("USD");
        assertThat(series.bars()).hasSizeGreaterThan(200);

        java.util.List<Bar> bars = Bars.normalize(series.bars());
        for (int i = 1; i < bars.size(); i++) {
            assertThat(bars.get(i).time()).isGreaterThan(bars.get(i - 1).time());
        }
    }
}
