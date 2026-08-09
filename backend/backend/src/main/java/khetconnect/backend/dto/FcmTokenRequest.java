package khetconnect.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class FcmTokenRequest {
    @NotBlank
    private String fcmToken;
}
