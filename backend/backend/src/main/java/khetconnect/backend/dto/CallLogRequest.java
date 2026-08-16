package khetconnect.backend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CallLogRequest {
    @NotNull
    private Long receiverId;

    private Long jobId;

    private Integer durationSeconds;
}
