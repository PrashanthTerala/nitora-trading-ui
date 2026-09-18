package com.terala.tradelab.config;

import java.util.List;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * CORS exists here for one reason: the upstream endpoint sends no CORS headers, so the browser
 * cannot call it directly and this service must.
 *
 * <p>Origins are listed explicitly rather than wildcarded. Spring echoes the matching origin
 * back, so a request that carries an {@code Origin} never receives a blanket {@code *} — which
 * matters because this service binds to loopback and a wildcard would invite any page the
 * learner happens to have open to read from it.
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    private final TradeLabProperties properties;

    public CorsConfig(TradeLabProperties properties) {
        this.properties = properties;
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        List<String> origins = properties.effectiveAllowedOrigins();
        registry.addMapping("/api/**")
                .allowedOrigins(origins.toArray(String[]::new))
                // Read-only service: OPTIONS is only here so the preflight itself succeeds.
                .allowedMethods("GET", "OPTIONS")
                .allowedHeaders("Content-Type", "Accept")
                .allowCredentials(false)
                .maxAge(3600);
    }
}
