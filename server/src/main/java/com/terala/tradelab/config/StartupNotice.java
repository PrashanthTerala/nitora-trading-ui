package com.terala.tradelab.config;

import com.terala.tradelab.cache.DiskCache;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

/**
 * Prints the terms notice on every start.
 *
 * <p>Not decoration: the default provider is an undocumented endpoint whose terms forbid
 * redistribution, and the person running this needs to see that in front of them rather than
 * buried in a README they read once. It also prints the bind address, so an operator who has
 * moved off loopback is reminded that they just made this reachable to others.
 */
@Component
public class StartupNotice {

    private static final Logger log = LoggerFactory.getLogger(StartupNotice.class);

    private final TradeLabProperties properties;
    private final DiskCache cache;
    private final Environment environment;

    public StartupNotice(TradeLabProperties properties, DiskCache cache, Environment environment) {
        this.properties = properties;
        this.cache = cache;
        this.environment = environment;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void announce() {
        String address = environment.getProperty("server.address", "127.0.0.1");
        String port = environment.getProperty("local.server.port",
                environment.getProperty("server.port", "5300"));

        log.info("TradeLab market data v{} listening on http://{}:{} (provider: {})",
                properties.version(), address, port, properties.provider());
        log.info("Cache directory: {}", cache.directory());
        log.info("NOTICE: this service is for personal, local, educational use. The default "
                + "provider is an unofficial endpoint whose terms prohibit redistribution of its "
                + "data. Do not expose this service publicly or republish what it serves. The "
                + "operator is responsible for complying with the provider's terms.");
        if (!"127.0.0.1".equals(address) && !"localhost".equals(address)) {
            log.warn("server.address is {} — this service is reachable beyond this machine. "
                    + "That is your decision to justify.", address);
        }
    }
}
