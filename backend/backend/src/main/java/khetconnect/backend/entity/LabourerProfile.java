package khetconnect.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "labourer_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LabourerProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    private String skills;

    @Builder.Default
    private Integer dailyWageExpected = 0;

    @Builder.Default
    private Integer totalJobsDone = 0;
}
