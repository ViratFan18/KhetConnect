package khetconnect.backend.dto;

import jakarta.validation.constraints.*;
import khetconnect.backend.entity.WorkType;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class PostJobRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title must not exceed 200 characters")
    private String title;

    @Size(max = 2000, message = "Description must not exceed 2000 characters")
    private String description;

    @NotNull(message = "Work type is required")
    private WorkType workType;

    @Size(max = 100, message = "Crop type must not exceed 100 characters")
    private String cropType;

    @NotNull(message = "Wage per day is required")
    @Min(value = 100, message = "Wage per day must be at least 100")
    @Max(value = 10000, message = "Wage per day must not exceed 10000")
    private Integer wagePerDay;

    @Min(value = 1, message = "Workers needed must be at least 1")
    @Max(value = 50, message = "Workers needed must not exceed 50")
    private Integer workersNeeded = 1;

    @NotNull(message = "Work date is required")
    @FutureOrPresent(message = "Work date must be today or in the future")
    private LocalDate workDate;

    @NotNull(message = "Latitude is required")
    private BigDecimal latitude;

    @NotNull(message = "Longitude is required")
    private BigDecimal longitude;

    @Size(max = 100, message = "Village name must not exceed 100 characters")
    private String village;
}
