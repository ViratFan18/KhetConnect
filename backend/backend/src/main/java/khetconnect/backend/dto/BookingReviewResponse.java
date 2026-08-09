package khetconnect.backend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BookingReviewResponse {
    private Long id;
    private Long bookingId;
    private Long reviewerId;
    private Long revieweeId;
    private Integer rating;
    private String comment;
}
