package khetconnect.backend.util;

import khetconnect.backend.dto.ApplicantResponse;
import khetconnect.backend.dto.JobResponse;
import khetconnect.backend.entity.ApplicationStatus;
import khetconnect.backend.entity.Job;
import khetconnect.backend.entity.JobApplication;
import khetconnect.backend.repository.JobApplicationRepository;
import khetconnect.backend.repository.JobRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Utility for building JobResponse DTOs.
 * Extracted for shared use across JobService and JobApplicationService.
 */
@Component
@RequiredArgsConstructor
public class JobResponseBuilder {

    private final JobRepository jobRepository;
    private final JobApplicationRepository applicationRepository;

    /**
     * Build a complete JobResponse DTO from a Job entity.
     *
     * @param job The job entity
     * @param viewerLat Latitude of the viewer (for distance calculation)
     * @param currentUserId Current user ID (for checking application status)
     * @param applicantsToInclude List of applicants to include (nullable)
     * @return JobResponse DTO
     */
    public JobResponse buildJobResponse(Job job, BigDecimal viewerLat, Long currentUserId, List<JobApplication> applicantsToInclude) {
        return toJobResponse(job, viewerLat, currentUserId, applicantsToInclude);
    }

    private JobResponse toJobResponse(Job job, BigDecimal viewerLat, Long currentUserId, List<JobApplication> applicantsToInclude) {
        long applicantCount = applicationRepository.countByJobId(job.getId());
        long acceptedCount = applicationRepository.countByJobIdAndStatus(job.getId(), ApplicationStatus.ACCEPTED);
        long pendingCount = applicationRepository.countByJobIdAndStatus(job.getId(), ApplicationStatus.PENDING);

        ApplicationStatus myStatus = null;
        if (currentUserId != null) {
            myStatus = applicationRepository.findByJobIdAndLabourerId(job.getId(), currentUserId)
                    .map(JobApplication::getStatus).orElse(null);
        }

        String visibleFarmerPhone = shouldRevealPhoneForJobViewer(currentUserId, job.getFarmer().getId(), job.getId())
                ? job.getFarmer().getPhone()
                : PiiMasker.maskPhone(job.getFarmer().getPhone());

        JobResponse.JobResponseBuilder builder = JobResponse.builder()
                .id(job.getId())
                .title(job.getTitle())
                .description(job.getDescription())
                .workType(job.getWorkType())
                .cropType(job.getCropType())
                .wagePerDay(job.getWagePerDay())
                .workersNeeded(job.getWorkersNeeded())
                .workDate(job.getWorkDate())
                .latitude(job.getLatitude())
                .longitude(job.getLongitude())
                .village(job.getVillage())
                .status(job.getStatus())
                .createdAt(job.getCreatedAt())
                .farmerId(job.getFarmer().getId())
                .farmerName(job.getFarmer().getName())
                .farmerPhone(visibleFarmerPhone)
                .farmerRating(job.getFarmer().getRatingAvg())
                .farmerRatingCount(job.getFarmer().getRatingCount())
                .applicantCount((int) applicantCount)
                .acceptedCount((int) acceptedCount)
                .pendingCount((int) pendingCount)
                .myApplicationStatus(myStatus);

        if (applicantsToInclude != null) {
            // Map JobApplication entities to ApplicantResponse DTOs
            List<khetconnect.backend.dto.ApplicantResponse> applicantResponses = applicantsToInclude.stream()
                    .map(this::toApplicantResponse)
                    .collect(java.util.stream.Collectors.toList());
            builder.applicants(applicantResponses);
        }

        if (viewerLat != null && job.getLatitude() != null && job.getLongitude() != null) {
            builder.distanceKm(GeoUtil.distanceKm(viewerLat, new BigDecimal("0"), job.getLatitude(), job.getLongitude()));
        }

        return builder.build();
    }

    private boolean shouldRevealPhoneForJobViewer(Long viewerId, Long farmerId, Long jobId) {
        // Reveal phone to: farmer (themselves), accepted applicants
        if (viewerId != null && viewerId.equals(farmerId)) {
            return true;
        }
        if (viewerId != null) {
            return applicationRepository.findByJobIdAndLabourerId(jobId, viewerId)
                    .map(app -> app.getStatus() == ApplicationStatus.ACCEPTED)
                    .orElse(false);
        }
        return false;
    }

    private khetconnect.backend.dto.ApplicantResponse toApplicantResponse(JobApplication app) {
        khetconnect.backend.entity.User labourer = app.getLabourer();
        return khetconnect.backend.dto.ApplicantResponse.builder()
                .applicationId(app.getId())
                .labourerId(labourer.getId())
                .name(labourer.getName())
                .ratingAvg(labourer.getRatingAvg())
                .ratingCount(labourer.getRatingCount())
                .status(app.getStatus())
                .appliedAt(app.getAppliedAt())
                .build();
    }
}
