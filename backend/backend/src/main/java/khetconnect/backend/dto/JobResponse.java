package khetconnect.backend.dto;

import khetconnect.backend.entity.ApplicationStatus;
import khetconnect.backend.entity.JobStatus;
import khetconnect.backend.entity.WorkType;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class JobResponse {
    private Long id;
    private String title;
    private String description;
    private WorkType workType;
    private String cropType;
    private Integer wagePerDay;
    private Integer workersNeeded;
    private LocalDate workDate;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private String village;
    private JobStatus status;
    private LocalDateTime createdAt;
    private Double distanceKm;
    private Long farmerId;
    private String farmerName;
    private String farmerPhone;
    private BigDecimal farmerRating;
    private Integer farmerRatingCount;
    private Integer applicantCount;
    private Integer acceptedCount;
    private Integer pendingCount;
    private ApplicationStatus myApplicationStatus;
    private List<ApplicantResponse> applicants;
}
