package khetconnect.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "availabilities")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Availability {

    public enum AvailabilityStatus { OPEN, BOOKED, COMPLETED, CANCELLED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "labourer_id", nullable = false)
    private User labourer;

    private String skills;

    private Integer workersAvailable;

    private Integer wagePerDay;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private WorkType workType = WorkType.OTHER;

    private LocalDate availableFrom;

    private LocalDate availableTo;

    @Column(precision = 10, scale = 8)
    private BigDecimal latitude;

    @Column(precision = 11, scale = 8)
    private BigDecimal longitude;

    private String village;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private AvailabilityStatus status = AvailabilityStatus.OPEN;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
}
