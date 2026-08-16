package khetconnect.backend.util;

import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashMap;
import java.util.Map;

/**
 * Centralized business event logging.
 * All events are logged to the "khetconnect.backend.events" logger
 * which is configured to write to business-events.log in JSON format.
 */
@Slf4j
public class BusinessEventLogger {
    
    private static final Logger businessEventLogger = LoggerFactory.getLogger("khetconnect.backend.events");
    
    public static void jobPosted(Long jobId, Long farmerId, String workType, String location) {
        businessEventLogger.info("JOB_POSTED",
            new MapBuilder()
                .put("event_type", "JOB_POSTED")
                .put("job_id", jobId)
                .put("farmer_id", PiiMasker.maskPhone(String.valueOf(farmerId)))
                .put("work_type", workType)
                .put("location", location)
                .build());
    }
    
    public static void applicationSubmitted(Long jobId, Long labourerId, String jobTitle) {
        businessEventLogger.info("APPLICATION_SUBMITTED",
            new MapBuilder()
                .put("event_type", "APPLICATION_SUBMITTED")
                .put("job_id", jobId)
                .put("labourer_id", PiiMasker.maskPhone(String.valueOf(labourerId)))
                .put("job_title", jobTitle)
                .build());
    }
    
    public static void applicationAccepted(Long jobId, Long labourerId, Long farmerId) {
        businessEventLogger.info("APPLICATION_ACCEPTED",
            new MapBuilder()
                .put("event_type", "APPLICATION_ACCEPTED")
                .put("job_id", jobId)
                .put("labourer_id", PiiMasker.maskPhone(String.valueOf(labourerId)))
                .put("farmer_id", PiiMasker.maskPhone(String.valueOf(farmerId)))
                .build());
    }
    
    public static void applicationRejected(Long jobId, Long labourerId, Long farmerId) {
        businessEventLogger.info("APPLICATION_REJECTED",
            new MapBuilder()
                .put("event_type", "APPLICATION_REJECTED")
                .put("job_id", jobId)
                .put("labourer_id", PiiMasker.maskPhone(String.valueOf(labourerId)))
                .put("farmer_id", PiiMasker.maskPhone(String.valueOf(farmerId)))
                .build());
    }
    
    public static void jobCompleted(Long jobId, Long farmerId, int acceptedCount) {
        businessEventLogger.info("JOB_COMPLETED",
            new MapBuilder()
                .put("event_type", "JOB_COMPLETED")
                .put("job_id", jobId)
                .put("farmer_id", PiiMasker.maskPhone(String.valueOf(farmerId)))
                .put("workers_accepted", acceptedCount)
                .build());
    }
    
    public static void notificationSendFailed(Long userId, String type, String reason) {
        businessEventLogger.error("NOTIFICATION_SEND_FAILED",
            new MapBuilder()
                .put("event_type", "NOTIFICATION_SEND_FAILED")
                .put("user_id", PiiMasker.maskPhone(String.valueOf(userId)))
                .put("notification_type", type)
                .put("reason", reason)
                .build());
    }
    
    public static void userRegistered(Long userId, String role) {
        businessEventLogger.info("USER_REGISTERED",
            new MapBuilder()
                .put("event_type", "USER_REGISTERED")
                .put("user_id", PiiMasker.maskPhone(String.valueOf(userId)))
                .put("role", role)
                .build());
    }
    
    public static void userLoggedIn(Long userId) {
        businessEventLogger.info("USER_LOGGED_IN",
            new MapBuilder()
                .put("event_type", "USER_LOGGED_IN")
                .put("user_id", PiiMasker.maskPhone(String.valueOf(userId)))
                .build());
    }
    
    /**
     * Helper class for building log messages as structured data
     */
    private static class MapBuilder {
        private final Map<String, Object> map = new HashMap<>();
        
        MapBuilder put(String key, Object value) {
            map.put(key, value);
            return this;
        }
        
        Map<String, Object> build() {
            return map;
        }
    }
}
