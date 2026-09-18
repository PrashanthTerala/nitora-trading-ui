package com.terala.tradelab.cache;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.AtomicMoveNotSupportedException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Optional;
import java.util.stream.Stream;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.terala.tradelab.dto.HealthResponse.CacheStats;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * A plain folder of JSON files, one per symbol+interval+range.
 *
 * <p>Deliberately not an in-memory cache: the expensive thing here is the upstream call, and a
 * restart during a lesson should not cost a fresh round of fetches. Deliberately not a database
 * either — an operator can delete the folder to reset it, and can read a file to see exactly
 * what was served.
 *
 * <p>Cache failures are never fatal. A cache that cannot be read or written degrades the service
 * to "always fetch", which is slower but still correct; throwing here would take the whole
 * request down for a disk problem that has nothing to do with the answer.
 */
public class DiskCache {

    private static final Logger log = LoggerFactory.getLogger(DiskCache.class);

    private final Path dir;
    private final ObjectMapper mapper;

    public DiskCache(Path dir, ObjectMapper mapper) {
        this.dir = dir.toAbsolutePath().normalize();
        this.mapper = mapper;
    }

    public Path directory() {
        return dir;
    }

    public Optional<CachedSeries> read(String key) {
        Path file = fileFor(key);
        if (!Files.isRegularFile(file)) {
            return Optional.empty();
        }
        try {
            CachedSeries entry = mapper.readValue(Files.readString(file, StandardCharsets.UTF_8),
                    CachedSeries.class);
            // A file whose key does not match is a hash collision or a hand-edited file; either
            // way it is not the answer to this question.
            if (entry == null || entry.bars() == null || !key.equals(entry.key())) {
                return Optional.empty();
            }
            return Optional.of(entry);
        } catch (IOException | RuntimeException e) {
            log.warn("Ignoring unreadable cache entry {}: {}", file.getFileName(), e.toString());
            return Optional.empty();
        }
    }

    public void write(CachedSeries entry) {
        Path file = fileFor(entry.key());
        try {
            Files.createDirectories(dir);
            // Write-then-rename so a crash or a concurrent reader never sees half a file.
            Path tmp = Files.createTempFile(dir, "w", ".tmp");
            Files.writeString(tmp, mapper.writeValueAsString(entry), StandardCharsets.UTF_8);
            try {
                Files.move(tmp, file, StandardCopyOption.REPLACE_EXISTING,
                        StandardCopyOption.ATOMIC_MOVE);
            } catch (AtomicMoveNotSupportedException e) {
                Files.move(tmp, file, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException | RuntimeException e) {
            log.warn("Could not cache {}: {}", entry.key(), e.toString());
        }
    }

    public CacheStats stats() {
        if (!Files.isDirectory(dir)) {
            return new CacheStats(0, 0L);
        }
        try (Stream<Path> files = Files.list(dir)) {
            int[] entries = {0};
            long[] bytes = {0L};
            files.filter(p -> p.getFileName().toString().endsWith(".json")).forEach(p -> {
                try {
                    bytes[0] += Files.size(p);
                    entries[0]++;
                } catch (IOException ignored) {
                    // The file vanished between listing and sizing; it simply does not count.
                }
            });
            return new CacheStats(entries[0], bytes[0]);
        } catch (IOException | UncheckedIOException e) {
            log.warn("Could not inspect the cache directory: {}", e.toString());
            return new CacheStats(0, 0L);
        }
    }

    /**
     * Cache keys contain characters that are legal in a ticker but awkward in a filename
     * ({@code ^}, {@code =}, {@code |}). The readable part is sanitised for humans browsing the
     * folder, and a hash of the true key is appended so two different keys can never collide
     * onto one file after sanitising.
     */
    Path fileFor(String key) {
        StringBuilder safe = new StringBuilder(key.length());
        for (char c : key.toCharArray()) {
            safe.append(Character.isLetterOrDigit(c) ? Character.toLowerCase(c) : '_');
        }
        return dir.resolve(safe + "-" + shortHash(key) + ".json");
    }

    private static String shortHash(String key) {
        try {
            byte[] digest = java.security.MessageDigest.getInstance("SHA-256")
                    .digest(key.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest, 0, 6).toLowerCase(Locale.ROOT);
        } catch (java.security.NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is required by every JVM", e);
        }
    }
}
