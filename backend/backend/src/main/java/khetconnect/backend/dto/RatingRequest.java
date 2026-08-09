package khetconnect.backend.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class RatingRequest {

    @NotNull
    private Long rateeId;

    @NotNull
    private Long jobId;

    @NotNull @Min(1) @Max(5)
    private Integer stars;

    private String comment;
}
