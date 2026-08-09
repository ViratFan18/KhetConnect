package khetconnect.backend.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class UpdateProfileRequest {
    @Size(min = 2, max = 50)
    private String name;
    private String village;
    private List<String> skills;
    private Integer dailyWageExpected;
    private String languagePref;
}
