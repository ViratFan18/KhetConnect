package khetconnect.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import khetconnect.backend.entity.UserRole;
import lombok.Data;

import java.util.List;

@Data
public class RegisterRequest {

    @NotBlank @Size(min = 2, max = 50)
    private String name;

    @NotBlank
    @Pattern(regexp = "^[6-9]\\d{9}$", message = "Phone must be 10 digits starting with 6-9")
    private String phone;

    @NotBlank @Size(min = 6, max = 100)
    private String password;

    private UserRole role;

    private String village;
    private List<String> skills;
    private Integer dailyWageExpected;
}
