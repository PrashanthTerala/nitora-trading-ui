package com.terala.tradelab.web;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * The same three requests an operator would curl, driven through the real wiring and the real
 * provider. Tagged {@code live} and skipped by default, because it needs the internet and an
 * endpoint nobody guarantees.
 *
 * <p>Run it with {@code mvn test -Dtest=LiveEndToEndTest -Dtest.excludedGroups=} when you want
 * proof the whole path works, or when the upstream shape may have drifted.
 */
@Tag("live")
@SpringBootTest(properties = "tradelab.cache.dir=target/test-cache/live")
@AutoConfigureMockMvc
class LiveEndToEndTest {

    @Autowired
    MockMvc mvc;

    @Test
    @DisplayName("health, symbols and a year of real AAPL daily bars")
    void servesAllThreeEndpointsAgainstTheRealProvider() throws Exception {
        mvc.perform(get("/api/health"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ok").value(true));

        mvc.perform(get("/api/symbols"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.symbols[0].symbol").value("AAPL"));

        mvc.perform(get("/api/history")
                        .param("symbol", "AAPL").param("interval", "1d").param("range", "1y"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.symbol").value("AAPL"))
                .andExpect(jsonPath("$.interval").value("1d"))
                .andExpect(jsonPath("$.currency").value("USD"))
                .andExpect(jsonPath("$.source").value("yahoo"))
                .andExpect(jsonPath("$.bars[0].time").isNumber())
                .andExpect(jsonPath("$.bars[0].close").isNumber())
                .andExpect(jsonPath("$.bars.length()").value(org.hamcrest.Matchers.greaterThan(200)));

        // The second call must come off disk, which is the whole reason this service exists.
        mvc.perform(get("/api/history")
                        .param("symbol", "AAPL").param("interval", "1d").param("range", "1y"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cached").value(true))
                .andExpect(jsonPath("$.stale").value(false));
    }
}
