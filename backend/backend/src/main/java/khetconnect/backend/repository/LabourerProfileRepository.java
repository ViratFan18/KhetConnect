package khetconnect.backend.repository;

import khetconnect.backend.entity.LabourerProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LabourerProfileRepository extends JpaRepository<LabourerProfile, Long> {
    Optional<LabourerProfile> findByUserId(Long userId);
}
