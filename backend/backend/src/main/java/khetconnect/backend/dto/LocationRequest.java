package khetconnect.backend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class LocationRequest {
    @NotNull
    private BigDecimal latitude;

    @NotNull
    private BigDecimal longitude;
}
