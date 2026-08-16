package khetconnect.backend.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class UpdateProfileRequest {
    @Size(min = 2, max = 50, message = "Name must be between 2 and 50 characters")
    private String name;

    @Size(max = 100, message = "Village name must not exceed 100 characters")
    private String village;

    private List<String> skills;

    @Min(value = 0, message = "Daily wage expected cannot be negative")
    @Max(value = 100000, message = "Daily wage expected is too high")
    private Integer dailyWageExpected;

    @Size(min = 2, max = 10, message = "Language preference must be between 2 and 10 characters")
    private String languagePref;
}
