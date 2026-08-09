package khetconnect.backend.dto;

import khetconnect.backend.entity.Availability.AvailabilityStatus;
import khetconnect.backend.entity.WorkType;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class AvailabilityResponse {
    private Long id;
    private Long labourerId;
    private String labourerName;
    private String skills;
    private Integer workersAvailable;
    private Integer wagePerDay;
    private WorkType workType;
    private LocalDate availableFrom;
    private LocalDate availableTo;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private String village;
    private AvailabilityStatus status;
    private LocalDateTime createdAt;
    private Double distanceKm;
}
