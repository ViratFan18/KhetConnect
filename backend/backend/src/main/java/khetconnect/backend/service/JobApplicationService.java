package khetconnect.backend.service;

import khetconnect.backend.dto.ApplicantResponse;
import khetconnect.backend.dto.JobResponse;
import khetconnect.backend.entity.ApplicationStatus;
import khetconnect.backend.entity.Job;
import khetconnect.backend.entity.JobApplication;
import khetconnect.backend.entity.JobStatus;
import khetconnect.backend.entity.LabourerProfile;
import khetconnect.backend.entity.User;
import khetconnect.backend.exception.AlreadyAppliedException;
import khetconnect.backend.exception.BadRequestException;
import khetconnect.backend.exception.JobAlreadyFullException;
import khetconnect.backend.exception.ResourceNotFoundException;
import khetconnect.backend.repository.JobApplicationRepository;
import khetconnect.backend.repository.JobRepository;
import khetconnect.backend.repository.LabourerProfileRepository;
import khetconnect.backend.repository.UserRepository;
import khetconnect.backend.util.BusinessEventLogger;
import khetconnect.backend.util.JobResponseBuilder;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for managing job applications.
 * Handles: apply to job, accept labourer, reject labourer, withdraw accepted application, get applicants.
 */
@Service
@RequiredArgsConstructor
public class JobApplicationService {

    private final JobRepository jobRepository;
    private final JobApplicationRepository applicationRepository;
    private final UserRepository userRepository;
    private final LabourerProfileRepository labourerProfileRepository;
    private final NotificationService notificationService;
    private final JobResponseBuilder jobResponseBuilder;

    /**
     * Apply to a job as a labourer.
     * Validates: job exists, not already applied, job has available slots.
     * Uses pessimistic locking to prevent race conditions.
     */
    @Transactional
    @CacheEvict(value = {"nearbyJobs", "myJobs"}, allEntries = true)
    public JobResponse applyToJob(Long jobId, Long labourerId) {
        // Pessimistic lock ensures no race conditions with concurrent applies/accepts
        Job job = jobRepository.findByIdWithLock(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job not found"));
        
        // Check job status and reject if not accepting applications
        if (job.getStatus() != JobStatus.OPEN && job.getStatus() != JobStatus.IN_PROGRESS) {
            throw new BadRequestException("Job is not accepting applications");
        }
        
        // Check if labourer already applied to this job
        if (applicationRepository.findByJobIdAndLabourerId(jobId, labourerId).isPresent()) {
            throw new AlreadyAppliedException("You have already applied to this job");
        }

        // Check if job is already full (all slots filled with accepted workers)
        long acceptedCount = applicationRepository.countByJobIdAndStatus(jobId, ApplicationStatus.ACCEPTED);
        if (acceptedCount >= job.getWorkersNeeded()) {
            throw new JobAlreadyFullException("This job already has sufficient workers. Another labourer must have been accepted first.");
        }

        User labourer = userRepository.findById(labourerId).orElseThrow();
        JobApplication app = JobApplication.builder()
                .job(job)
                .labourer(labourer)
                .status(ApplicationStatus.PENDING)
                .build();
        applicationRepository.save(app);

        BusinessEventLogger.applicationSubmitted(jobId, labourerId, job.getTitle());
        
        notificationService.notifyUser(job.getFarmer(),
                "New Application",
                labourer.getName() + " applied for " + job.getTitle(),
                "APPLICATION",
                jobId);

        return jobResponseBuilder.buildJobResponse(job, labourer.getLatitude(), labourerId, null);
    }

    /**
     * Accept a labourer's application for a job.
     * Validates: farmer owns job, application exists, job has available slots.
     * Uses pessimistic locking with double-check to prevent exceeding workersNeeded.
     */
    @Transactional
    @CacheEvict(value = {"nearbyJobs", "myJobs"}, allEntries = true)
    public JobResponse acceptLabourer(Long jobId, Long labourerId, Long farmerId) {
        // Pessimistic lock ensures accept operations are atomic and don't exceed workersNeeded
        Job job = jobRepository.findByIdWithLock(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job not found"));
        
        // Validate farmer owns this job
        if (!job.getFarmer().getId().equals(farmerId)) {
            throw new BadRequestException("You do not have permission to accept applications for this job");
        }

        // Check if we can still accept more workers (atomic count within the lock)
        long acceptedCount = applicationRepository.countByJobIdAndStatus(jobId, ApplicationStatus.ACCEPTED);
        if (acceptedCount >= job.getWorkersNeeded()) {
            throw new JobAlreadyFullException("This job already has all required workers accepted");
        }

        // Fetch the application to accept
        JobApplication app = applicationRepository.findByJobIdAndLabourerId(jobId, labourerId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));
        
        // Prevent accepting the same application twice
        if (app.getStatus() == ApplicationStatus.ACCEPTED) {
            throw new BadRequestException("This application has already been accepted");
        }
        
        app.setStatus(ApplicationStatus.ACCEPTED);
        applicationRepository.save(app);

        // Re-count to ensure we're still under the limit (double-check after save)
        long newAcceptedCount = applicationRepository.countByJobIdAndStatus(jobId, ApplicationStatus.ACCEPTED);
        if (newAcceptedCount > job.getWorkersNeeded()) {
            // This should never happen with proper locking, but fail fast if it does
            throw new JobAlreadyFullException("Concurrency check failed: job would exceed worker limit");
        }

        // Update job status to IN_PROGRESS if all slots are now filled
        if (newAcceptedCount >= job.getWorkersNeeded()) {
            job.setStatus(JobStatus.IN_PROGRESS);
            job.setUpdatedAt(LocalDateTime.now());
            jobRepository.save(job);
        }

        BusinessEventLogger.applicationAccepted(jobId, labourerId, farmerId);
        
        notificationService.notifyUser(app.getLabourer(),
                "Application Accepted",
                "You were accepted for " + job.getTitle(),
                "APPLICATION_ACCEPTED",
                jobId);

        List<JobApplication> applicants = applicationRepository.findByJobIdOrderByAppliedAtDesc(jobId);
        return jobResponseBuilder.buildJobResponse(job, null, farmerId, applicants);
    }

    /**
     * Reject a labourer's application for a job.
     */
    @Transactional
    @CacheEvict(value = {"nearbyJobs", "myJobs"}, allEntries = true)
    public JobResponse rejectLabourer(Long jobId, Long labourerId, Long farmerId) {
        validateFarmerJob(jobId, farmerId);
        JobApplication app = applicationRepository.findByJobIdAndLabourerId(jobId, labourerId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));
        app.setStatus(ApplicationStatus.REJECTED);
        applicationRepository.save(app);
        Job job = jobRepository.findById(jobId).orElseThrow();
        
        BusinessEventLogger.applicationRejected(jobId, labourerId, farmerId);
        
        // Send rejection notification to labourer with jobId for idempotency
        notificationService.notifyUser(app.getLabourer(),
                "Application Rejected",
                "Your application for " + job.getTitle() + " was not accepted",
                "APPLICATION_REJECTED",
                jobId);
        
        List<JobApplication> applicants = applicationRepository.findByJobIdOrderByAppliedAtDesc(jobId);
        return jobResponseBuilder.buildJobResponse(job, null, farmerId, applicants);
    }

    /**
     * Withdraw an accepted application (labourer perspective).
     */
    @Transactional
    @CacheEvict(value = {"nearbyJobs", "myJobs"}, allEntries = true)
    public JobResponse cancelAcceptedApplication(Long jobId, Long labourerId) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job not found"));

        JobApplication application = applicationRepository.findByJobIdAndLabourerId(jobId, labourerId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));

        if (application.getStatus() != ApplicationStatus.ACCEPTED) {
            throw new BadRequestException("Only accepted applications can be withdrawn");
        }

        application.setStatus(ApplicationStatus.REJECTED);
        applicationRepository.save(application);

        long acceptedCount = applicationRepository.countByJobIdAndStatus(jobId, ApplicationStatus.ACCEPTED);
        if (job.getStatus() == JobStatus.IN_PROGRESS && acceptedCount <= 0) {
            job.setStatus(JobStatus.OPEN);
            job.setUpdatedAt(LocalDateTime.now());
            jobRepository.save(job);
        }

        notificationService.notifyUser(
                job.getFarmer(),
                "Accepted Job Cancelled",
                "The accepted worker withdrew from \"" + job.getTitle() + "\".",
                "JOB_CANCELLED"
        );

        return jobResponseBuilder.buildJobResponse(job, null, null, applicationRepository.findByJobIdOrderByAppliedAtDesc(jobId));
    }

    /**
     * Get list of applicants for a job (farmer perspective).
     */
    @Transactional(readOnly = true)
    public List<ApplicantResponse> getApplicants(Long jobId, Long farmerId) {
        validateFarmerJob(jobId, farmerId);
        return applicationRepository.findByJobIdOrderByAppliedAtDesc(jobId).stream()
                .map(this::toApplicantResponse)
                .collect(Collectors.toList());
    }

    private Job validateFarmerJob(Long jobId, Long farmerId) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job not found"));
        if (!job.getFarmer().getId().equals(farmerId)) {
            throw new BadRequestException("Not authorized for this job");
        }
        return job;
    }

    private ApplicantResponse toApplicantResponse(JobApplication app) {
        User labourer = app.getLabourer();
        String village = labourerProfileRepository.findByUserId(labourer.getId())
                .map(LabourerProfile::getSkills).orElse("");
        return ApplicantResponse.builder()
                .applicationId(app.getId())
                .labourerId(labourer.getId())
                .name(labourer.getName())
                .skills(village)
                .ratingAvg(labourer.getRatingAvg())
                .ratingCount(labourer.getRatingCount())
                .status(app.getStatus())
                .appliedAt(app.getAppliedAt())
                .build();
    }
}
