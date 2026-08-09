package khetconnect.backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PostBookingRequest {
    @NotNull
    @Min(1)
    private Integer workersBooked;

    @NotNull
    @Min(0)
    private Integer amount;
}
