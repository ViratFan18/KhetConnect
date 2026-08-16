package khetconnect.backend.repository;

import khetconnect.backend.entity.ApplicationStatus;
import khetconnect.backend.entity.JobApplication;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface JobApplicationRepository extends JpaRepository<JobApplication, Long> {
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"job", "job.farmer", "labourer"})
    List<JobApplication> findByJobIdOrderByAppliedAtDesc(Long jobId);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"job", "job.farmer", "labourer"})
    Optional<JobApplication> findByJobIdAndLabourerId(Long jobId, Long labourerId);

    long countByJobId(Long jobId);
    long countByJobIdAndStatus(Long jobId, ApplicationStatus status);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"job", "job.farmer", "labourer"})
    List<JobApplication> findByLabourerIdOrderByAppliedAtDesc(Long labourerId);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"job", "job.farmer", "labourer"})
    List<JobApplication> findByJobIdAndStatus(Long jobId, ApplicationStatus status);
}
