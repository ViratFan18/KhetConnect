package khetconnect.backend.dto;

import jakarta.validation.constraints.*;
import khetconnect.backend.entity.WorkType;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class PostJobRequest {

    @NotBlank @Size(max = 200)
    private String title;

    private String description;

    @NotNull
    private WorkType workType;

    private String cropType;

    @NotNull @Min(100) @Max(10000)
    private Integer wagePerDay;

    @Min(1) @Max(50)
    private Integer workersNeeded = 1;

    @NotNull
    @FutureOrPresent
    private LocalDate workDate;

    @NotNull
    private BigDecimal latitude;

    @NotNull
    private BigDecimal longitude;

    private String village;
}
