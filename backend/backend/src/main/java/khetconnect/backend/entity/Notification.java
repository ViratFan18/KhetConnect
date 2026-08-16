package khetconnect.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "job_id", "type"}, 
                name = "uk_notifications_user_job_type")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id")
    private Job job;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String body;

    private String type;

    @Builder.Default
    private Boolean read = false;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
