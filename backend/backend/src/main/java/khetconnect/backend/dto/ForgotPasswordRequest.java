package khetconnect.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class ForgotPasswordRequest {

    @NotBlank(message = "Phone is required")
    @Pattern(regexp = "^[6-9]\\d{9}$", message = "Phone must be 10 digits starting with 6-9")
    private String phone;
}
