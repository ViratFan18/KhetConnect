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

    @Size(max = 200, message = "Comment must be at most 200 characters")
    private String comment;
}
