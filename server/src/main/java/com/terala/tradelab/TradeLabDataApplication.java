package com.terala.tradelab;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

/**
 * Optional "real data" replay backend for TradeLab Academy.
 *
 * <p>The browser cannot call the upstream chart endpoint directly (no CORS headers) and
 * should not call it repeatedly anyway. This service sits in front of it: it adds the CORS
 * headers, caches on disk so a classroom of tabs causes one upstream fetch, normalises the
 * bars into the shape the simulator expects, and keeps the provider behind an interface so
 * a licensed vendor can be dropped in.
 */
@SpringBootApplication
@ConfigurationPropertiesScan
public class TradeLabDataApplication {

    public static void main(String[] args) {
        SpringApplication.run(TradeLabDataApplication.class, args);
    }
}
