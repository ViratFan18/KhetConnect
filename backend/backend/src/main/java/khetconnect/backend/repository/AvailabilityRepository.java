package khetconnect.backend.repository;

import khetconnect.backend.entity.Availability;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AvailabilityRepository extends JpaRepository<Availability, Long> {
    List<Availability> findByLabourerIdOrderByCreatedAtDesc(Long labourerId);
}
