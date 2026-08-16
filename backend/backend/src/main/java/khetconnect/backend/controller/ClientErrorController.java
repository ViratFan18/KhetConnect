package khetconnect.backend.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Endpoint for frontend error reporting.
 * Logs client-side errors for debugging and monitoring.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1")
public class ClientErrorController {

    @PostMapping("/client-errors")
    public Map<String, String> reportClientError(@RequestBody Map<String, Object> errorReport) {
        try {
            String message = (String) errorReport.getOrDefault("message", "Unknown error");
            String stack = (String) errorReport.getOrDefault("stack", "");
            String url = (String) errorReport.getOrDefault("url", "");
            String userAgent = (String) errorReport.getOrDefault("userAgent", "");
            Long timestamp = (Long) errorReport.getOrDefault("timestamp", System.currentTimeMillis());
            
            // Log the error with relevant context
            log.error("CLIENT_ERROR: {} | URL: {} | UA: {}\nStack:\n{}",
                message, url, userAgent, stack);
            
            // Also log as structured event for monitoring
            log.info("Frontend error reported: {}", message);
            
            return Map.of("status", "logged");
        } catch (Exception e) {
            log.error("Failed to process client error report", e);
            return Map.of("status", "error", "message", e.getMessage());
        }
    }
}
