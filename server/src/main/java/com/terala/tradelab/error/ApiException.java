package com.terala.tradelab.error;

import org.springframework.http.HttpStatus;

/**
 * An error the caller is allowed to see. The message is deliberately a plain sentence: it is
 * rendered verbatim in the browser, so it must never leak a stack trace, a URL or a class name.
 */
public class ApiException extends RuntimeException {

    private final HttpStatus status;

    public ApiException(HttpStatus status, String message) {
        this(status, message, null);
    }

    public ApiException(HttpStatus status, String message, Throwable cause) {
        super(message, cause);
        this.status = status;
    }

    public HttpStatus status() {
        return status;
    }

    /** The caller asked for something that cannot exist: bad interval, bad symbol, bad range. */
    public static ApiException badRequest(String message) {
        return new ApiException(HttpStatus.BAD_REQUEST, message);
    }

    /** The provider answered, but has nothing for this symbol at this resolution. */
    public static ApiException noData(String message) {
        return new ApiException(HttpStatus.NOT_FOUND, message);
    }

    /** The provider broke, refused us, or sent something we cannot parse. */
    public static ApiException upstreamFailed(String message, Throwable cause) {
        return new ApiException(HttpStatus.BAD_GATEWAY, message, cause);
    }

    /** The provider did not answer in time. */
    public static ApiException upstreamTimeout(String message, Throwable cause) {
        return new ApiException(HttpStatus.GATEWAY_TIMEOUT, message, cause);
    }

    /** True when retrying later (or serving a stale cache entry) could plausibly help. */
    public boolean isUpstreamFault() {
        return status == HttpStatus.NOT_FOUND
                || status == HttpStatus.BAD_GATEWAY
                || status == HttpStatus.GATEWAY_TIMEOUT;
    }
}
