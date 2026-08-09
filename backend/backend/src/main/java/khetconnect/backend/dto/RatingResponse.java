package khetconnect.backend.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class RatingResponse {
    private Long id;
    private Long jobId;
    private Integer stars;
    private String comment;
    private String raterName;
    private LocalDateTime createdAt;
}
