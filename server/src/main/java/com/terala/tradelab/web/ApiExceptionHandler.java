package com.terala.tradelab.web;

import com.terala.tradelab.dto.ErrorResponse;
import com.terala.tradelab.error.ApiException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.NoHandlerFoundException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

/**
 * Every error leaves through here, as {@code {"error":"<sentence>"}} and nothing else.
 *
 * <p>The browser prints the sentence straight to a learner, so a stack trace or a Spring
 * exception name would be both useless and a small information leak about the upstream URL.
 * Detail goes to the log; the caller gets a sentence and the right status.
 */
@RestControllerAdvice
public class ApiExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ErrorResponse> handleApi(ApiException e) {
        if (e.status().is5xxServerError()) {
            log.warn("{} -> {}", e.status().value(), e.getMessage(), e);
        }
        return ResponseEntity.status(e.status()).body(new ErrorResponse(e.getMessage()));
    }

    @ExceptionHandler({MissingServletRequestParameterException.class,
            MethodArgumentTypeMismatchException.class, IllegalArgumentException.class})
    public ResponseEntity<ErrorResponse> handleBadRequest(Exception e) {
        String message = e instanceof MissingServletRequestParameterException missing
                ? "Missing required query parameter '" + missing.getParameterName() + "'."
                : "That request could not be understood.";
        return ResponseEntity.badRequest().body(new ErrorResponse(message));
    }

    /**
     * Which of these two Spring throws for an unknown path depends on whether static resource
     * handling is enabled, so both are mapped; otherwise one of them would fall through to the
     * catch-all and report a 500 for a simple typo in the URL.
     */
    @ExceptionHandler({NoHandlerFoundException.class, NoResourceFoundException.class})
    public ResponseEntity<ErrorResponse> handleNotFound(Exception e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse("No such endpoint. This service serves /api/health, "
                        + "/api/symbols and /api/history."));
    }

    /**
     * The catch-all. Anything reaching here is a bug in this service, so it is logged in full
     * and reported as a flat 500 without detail.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnexpected(Exception e) {
        log.error("Unhandled failure serving a market data request", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("The data service hit an unexpected problem. "
                        + "Check the server log for details."));
    }
}
