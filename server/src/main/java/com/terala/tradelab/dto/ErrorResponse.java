package com.terala.tradelab.dto;

/**
 * The only error shape this service emits. One field, one plain sentence, because the browser
 * shows it to the learner verbatim.
 */
public record ErrorResponse(String error) {
}
