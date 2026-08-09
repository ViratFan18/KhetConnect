package khetconnect.backend.dto;

import khetconnect.backend.entity.Booking;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class BookingResponse {
    private Long id;
    private AvailabilityResponse availability;
    private Long farmerId;
    private String farmerName;
    private Integer workersBooked;
    private Integer amount;
    private Booking.BookingStatus status;
    private Boolean reviewedByFarmer;
    private Boolean reviewedByLabourer;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime respondedAt;
    private LocalDateTime completedAt;
}
