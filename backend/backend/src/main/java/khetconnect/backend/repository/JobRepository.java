package khetconnect.backend.repository;

import khetconnect.backend.entity.Job;
import khetconnect.backend.entity.JobStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface JobRepository extends JpaRepository<Job, Long> {
    List<Job> findByFarmerIdOrderByCreatedAtDesc(Long farmerId);
    List<Job> findByStatusOrderByCreatedAtDesc(JobStatus status);
}
