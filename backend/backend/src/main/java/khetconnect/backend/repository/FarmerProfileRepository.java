package khetconnect.backend.repository;

import khetconnect.backend.entity.FarmerProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FarmerProfileRepository extends JpaRepository<FarmerProfile, Long> {
    Optional<FarmerProfile> findByUserId(Long userId);
}
