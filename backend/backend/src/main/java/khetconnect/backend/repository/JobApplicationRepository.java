package khetconnect.backend.repository;

import khetconnect.backend.entity.ApplicationStatus;
import khetconnect.backend.entity.JobApplication;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface JobApplicationRepository extends JpaRepository<JobApplication, Long> {
    List<JobApplication> findByJobIdOrderByAppliedAtDesc(Long jobId);
    Optional<JobApplication> findByJobIdAndLabourerId(Long jobId, Long labourerId);
    long countByJobId(Long jobId);
    long countByJobIdAndStatus(Long jobId, ApplicationStatus status);
    List<JobApplication> findByLabourerIdOrderByAppliedAtDesc(Long labourerId);
    List<JobApplication> findByJobIdAndStatus(Long jobId, ApplicationStatus status);
}
