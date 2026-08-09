package khetconnect.backend.dto;

import khetconnect.backend.entity.ApplicationStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class ApplicantResponse {
    private Long applicationId;
    private Long labourerId;
    private String name;
    private String village;
    private String skills;
    private BigDecimal ratingAvg;
    private Integer ratingCount;
    private ApplicationStatus status;
    private LocalDateTime appliedAt;
}
