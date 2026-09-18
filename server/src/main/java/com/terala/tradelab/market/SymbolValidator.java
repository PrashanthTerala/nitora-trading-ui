package com.terala.tradelab.market;

import java.util.Locale;
import java.util.regex.Pattern;

import com.terala.tradelab.error.ApiException;

/**
 * The symbol becomes part of an upstream URL path and part of a cache filename, so it is the
 * one piece of caller input that could turn this service into an open proxy or write outside
 * the cache directory. It is therefore matched against a deliberately narrow allow-list rather
 * than escaped: everything real tickers need ({@code BRK.B}, {@code ^GSPC}, {@code BTC-USD},
 * {@code EURUSD=X}) and nothing else. No slashes, no dots in sequence, no percent signs.
 */
public final class SymbolValidator {

    /**
     * A dot is needed for {@code BRK.B} but must not open the symbol or repeat, or {@code ..}
     * would itself be a "valid" ticker. Nothing downstream would actually traverse with it — the
     * URI builder encodes and the cache sanitises — but a validator that accepts {@code ..} is
     * one refactor away from being the hole it was written to close.
     */
    private static final Pattern ALLOWED = Pattern.compile("^[A-Za-z0-9^][A-Za-z0-9.^=-]{0,14}$");

    private SymbolValidator() {
    }

    /** @return the symbol upper-cased, so cache keys for "aapl" and "AAPL" are the same entry */
    public static String normalize(String raw) {
        if (!isValid(raw)) {
            throw ApiException.badRequest("Invalid symbol. Use a plain ticker such as AAPL, "
                    + "BTC-USD or EURUSD=X (letters, digits, dot, caret, equals or hyphen; 15 characters at most).");
        }
        return raw.toUpperCase(Locale.ROOT);
    }

    public static boolean isValid(String raw) {
        return raw != null && !raw.contains("..") && ALLOWED.matcher(raw).matches();
    }
}
