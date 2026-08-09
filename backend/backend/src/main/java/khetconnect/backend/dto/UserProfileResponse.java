package khetconnect.backend.dto;

import khetconnect.backend.entity.UserRole;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class UserProfileResponse {
    private Long id;
    private String name;
    private String phone;
    private UserRole role;
    private String village;
    private List<String> skills;
    private Integer dailyWageExpected;
    private BigDecimal ratingAvg;
    private Integer ratingCount;
    private Integer totalJobs;
    private String languagePref;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private LocalDateTime createdAt;
}
