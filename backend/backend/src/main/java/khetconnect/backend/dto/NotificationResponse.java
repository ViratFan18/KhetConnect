package khetconnect.backend.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class NotificationResponse {
    private Long id;
    private String title;
    private String body;
    private String type;
    private Boolean read;
    private LocalDateTime createdAt;
}
