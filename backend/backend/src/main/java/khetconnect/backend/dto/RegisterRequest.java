package khetconnect.backend.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import khetconnect.backend.entity.UserRole;
import lombok.Data;

import java.util.List;

@Data
public class RegisterRequest {

    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 50, message = "Name must be between 2 and 50 characters")
    private String name;

    @NotBlank(message = "Phone is required")
    @Pattern(regexp = "^[6-9]\\d{9}$", message = "Phone must be 10 digits starting with 6-9")
    private String phone;

    @NotBlank(message = "Password is required")
    @Size(min = 6, max = 100, message = "Password must be between 6 and 100 characters")
    private String password;

    @NotNull(message = "Role is required")
    private UserRole role;

    @Size(max = 100, message = "Village name must not exceed 100 characters")
    private String village;

    private List<String> skills;

    @Min(value = 0, message = "Daily wage expected cannot be negative")
    @Max(value = 100000, message = "Daily wage expected is too high")
    private Integer dailyWageExpected;
}
