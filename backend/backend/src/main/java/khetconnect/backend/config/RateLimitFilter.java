package khetconnect.backend.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private static final long WINDOW_MS = 60_000L;
    private static final int AUTH_LIMIT = 20;
    private static final int GENERAL_LIMIT = 250;

    private final Map<String, Deque<Long>> requestBuckets = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String method = request.getMethod();
        String path = request.getRequestURI();
        return "OPTIONS".equalsIgnoreCase(method) || path.startsWith("/h2-console");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String key = resolveClientKey(request);
        // Apply stricter rate limiting to auth endpoints to prevent brute force attacks
        int limit = isAuthEndpoint(request) ? AUTH_LIMIT : GENERAL_LIMIT;

        Deque<Long> timestamps = requestBuckets.computeIfAbsent(key, ignored -> new ArrayDeque<>());
        long now = Instant.now().toEpochMilli();

        boolean rateLimited;
        synchronized (timestamps) {
            pruneOldEntries(timestamps, now);
            if (timestamps.size() >= limit) {
                long retryAfterSeconds = calculateRetryAfter(timestamps, now);
                response.setStatus(429);
                response.setHeader("Retry-After", String.valueOf(Math.max(1, retryAfterSeconds)));
                response.setHeader("X-RateLimit-Limit", String.valueOf(limit));
                response.setHeader("X-RateLimit-Remaining", "0");
                response.setContentType("application/json");
                response.setCharacterEncoding("UTF-8");
                objectMapper.writeValue(response.getOutputStream(), Map.of(
                        "status", 429,
                        "error", "RATE_LIMITED",
                        "message", "Too many requests. Please slow down and try again shortly.",
                        "timestamp", Instant.now().toString()
                ));
                rateLimited = true;
            } else {
                timestamps.addLast(now);
                rateLimited = false;
            }
        }

        if (rateLimited) {
            return;
        }

        response.setHeader("X-RateLimit-Limit", String.valueOf(limit));
        response.setHeader("X-RateLimit-Remaining", String.valueOf(Math.max(0, limit - timestamps.size())));
        filterChain.doFilter(request, response);
    }

    private String resolveClientKey(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }
        return request.getRemoteAddr() != null ? request.getRemoteAddr() : "unknown";
    }

    private boolean isAuthEndpoint(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.contains("/api/v1/auth/login")
                || path.contains("/api/v1/auth/register")
                || path.contains("/api/v1/auth/forgot-password")
                || path.contains("/api/v1/auth/reset-password")
                || path.contains("/api/v1/auth/refresh");
    }

    private void pruneOldEntries(Deque<Long> timestamps, long now) {
        while (!timestamps.isEmpty() && now - timestamps.peekFirst() > WINDOW_MS) {
            timestamps.pollFirst();
        }
    }

    private long calculateRetryAfter(Deque<Long> timestamps, long now) {
        if (timestamps.isEmpty()) {
            return 1L;
        }
        long oldest = timestamps.peekFirst();
        return Math.max(1L, (WINDOW_MS - (now - oldest)) / 1000L + 1L);
    }
}
