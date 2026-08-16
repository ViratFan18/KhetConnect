package khetconnect.backend.event;

import khetconnect.backend.entity.User;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class NotificationEvent {
    private User user;
    private String title;
    private String body;
    private String type;
    private Long jobId;  // Optional: used for deduplication
}
