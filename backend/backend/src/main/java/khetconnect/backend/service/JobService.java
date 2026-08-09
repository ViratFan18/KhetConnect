package khetconnect.backend.service;

import khetconnect.backend.dto.*;
import khetconnect.backend.entity.*;
import khetconnect.backend.exception.BadRequestException;
import khetconnect.backend.exception.ResourceNotFoundException;
import khetconnect.backend.repository.*;
import khetconnect.backend.util.GeoUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class JobService {

    private static final double NEARBY_RADIUS_KM = 5.0;

    private final JobRepository jobRepository;
    private final JobApplicationRepository applicationRepository;
    private final UserRepository userRepository;
    private final FarmerProfileRepository farmerProfileRepository;
    private final LabourerProfileRepository labourerProfileRepository;
    private final NotificationService notificationService;
    private final AuthService authService;

    @Transactional
    @CacheEvict(value = {"nearbyJobs", "myJobs"}, allEntries = true)
    public JobResponse createJob(PostJobRequest request, Long farmerId) {
        User farmer = userRepository.findById(farmerId)
                .orElseThrow(() -> new ResourceNotFoundException("Farmer not found"));

        Job job = Job.builder()
                .farmer(farmer)
                .title(request.getTitle())
                .description(request.getDescription())
                .workType(request.getWorkType())
                .cropType(request.getCropType())
                .wagePerDay(request.getWagePerDay())
                .workersNeeded(request.getWorkersNeeded() != null ? request.getWorkersNeeded() : 1)
                .workDate(request.getWorkDate())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .village(request.getVillage())
                .status(JobStatus.OPEN)
                .build();
        job = jobRepository.save(job);

        farmerProfileRepository.findByUserId(farmerId).ifPresent(fp -> {
            fp.setTotalJobsPosted(fp.getTotalJobsPosted() + 1);
            farmerProfileRepository.save(fp);
        });

        notifyNearbyLabourers(job);
        return toJobResponse(job, null, null);
    }

    @Async
    public void notifyNearbyLabourers(Job job) {
        List<User> labourers = userRepository.findActiveByRole(UserRole.LABOURER);
        for (User labourer : labourers) {
            if (GeoUtil.withinKm(job.getLatitude(), job.getLongitude(),
                    labourer.getLatitude(), labourer.getLongitude(), NEARBY_RADIUS_KM)) {
                String title = "Work Available - " + (job.getVillage() != null ? job.getVillage() : "Nearby");
                String body = job.getWorkType() + " | Rs." + job.getWagePerDay() + "/day | " + job.getWorkDate();
                notificationService.notifyUser(labourer, title, body, "JOB_POSTED");
            }
        }
    }

    @Cacheable("myJobs")
    public List<JobResponse> getMyPosts(Long farmerId) {
        return jobRepository.findByFarmerIdOrderByCreatedAtDesc(farmerId).stream()
                .map(j -> toJobResponse(j, null, farmerId))
                .collect(Collectors.toList());
    }

    @Cacheable("nearbyJobs")
    public List<JobResponse> getNearbyJobs(BigDecimal lat, BigDecimal lng, Long labourerId) {
        return jobRepository.findByStatusOrderByCreatedAtDesc(JobStatus.OPEN).stream()
                .filter(j -> j.getLatitude() != null && j.getLongitude() != null)
                .filter(j -> GeoUtil.withinKm(lat, lng, j.getLatitude(), j.getLongitude(), NEARBY_RADIUS_KM))
                .sorted(Comparator.comparingDouble(j ->
                        GeoUtil.distanceKm(lat, lng, j.getLatitude(), j.getLongitude())))
                .map(j -> {
                    JobResponse resp = toJobResponse(j, lat, labourerId);
                    resp.setDistanceKm(GeoUtil.distanceKm(lat, lng, j.getLatitude(), j.getLongitude()));
                    return resp;
                })
                .collect(Collectors.toList());
    }

    public JobResponse getJobById(Long jobId, Long currentUserId) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job not found"));
        User current = userRepository.findById(currentUserId).orElseThrow();
        BigDecimal lat = current.getLatitude();
        return toJobResponse(job, lat, currentUserId);
    }

    @Transactional
    public JobResponse applyToJob(Long jobId, Long labourerId) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job not found"));
        if (job.getStatus() != JobStatus.OPEN && job.getStatus() != JobStatus.IN_PROGRESS) {
            throw new BadRequestException("Job is not accepting applications");
        }
        if (applicationRepository.findByJobIdAndLabourerId(jobId, labourerId).isPresent()) {
            throw new BadRequestException("Already applied to this job");
        }

        User labourer = userRepository.findById(labourerId).orElseThrow();
        JobApplication app = JobApplication.builder()
                .job(job)
                .labourer(labourer)
                .status(ApplicationStatus.PENDING)
                .build();
        applicationRepository.save(app);

        notificationService.notifyUser(job.getFarmer(),
                "New Application",
                labourer.getName() + " applied for " + job.getTitle(),
                "APPLICATION");

        return toJobResponse(job, labourer.getLatitude(), labourerId);
    }

    @Transactional
    @CacheEvict(value = {"nearbyJobs", "myJobs"}, allEntries = true)
    public JobResponse acceptLabourer(Long jobId, Long labourerId, Long farmerId) {
        Job job = validateFarmerJob(jobId, farmerId);
        JobApplication app = applicationRepository.findByJobIdAndLabourerId(jobId, labourerId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));
        app.setStatus(ApplicationStatus.ACCEPTED);
        applicationRepository.save(app);

        long accepted = applicationRepository.countByJobIdAndStatus(jobId, ApplicationStatus.ACCEPTED);
        if (accepted >= job.getWorkersNeeded()) {
            job.setStatus(JobStatus.IN_PROGRESS);
            job.setUpdatedAt(LocalDateTime.now());
            jobRepository.save(job);
        }

        notificationService.notifyUser(app.getLabourer(),
                "Application Accepted",
                "You were accepted for " + job.getTitle(),
                "APPLICATION_ACCEPTED");

        return toJobResponse(job, null, farmerId);
    }

    @Transactional
    @CacheEvict(value = {"nearbyJobs", "myJobs"}, allEntries = true)
    public JobResponse rejectLabourer(Long jobId, Long labourerId, Long farmerId) {
        validateFarmerJob(jobId, farmerId);
        JobApplication app = applicationRepository.findByJobIdAndLabourerId(jobId, labourerId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));
        app.setStatus(ApplicationStatus.REJECTED);
        applicationRepository.save(app);
        Job job = jobRepository.findById(jobId).orElseThrow();
        return toJobResponse(job, null, farmerId);
    }

    @Transactional
    @CacheEvict(value = {"nearbyJobs", "myJobs"}, allEntries = true)
    public JobResponse completeJob(Long jobId, Long farmerId) {
        Job job = validateFarmerJob(jobId, farmerId);
        if (job.getStatus() == JobStatus.COMPLETED) {
            throw new BadRequestException("Job already completed");
        }
        if (job.getStatus() == JobStatus.CANCELLED) {
            throw new BadRequestException("Cannot complete cancelled job");
        }

        job.setStatus(JobStatus.COMPLETED);
        job.setUpdatedAt(LocalDateTime.now());
        jobRepository.save(job);

        List<JobApplication> accepted = applicationRepository.findByJobIdAndStatus(jobId, ApplicationStatus.ACCEPTED);
        for (JobApplication app : accepted) {
            labourerProfileRepository.findByUserId(app.getLabourer().getId()).ifPresent(lp -> {
                lp.setTotalJobsDone(lp.getTotalJobsDone() + 1);
                labourerProfileRepository.save(lp);
            });
            notificationService.notifyUser(app.getLabourer(),
                    "Job Complete!",
                    "Please rate your experience to build your profile",
                    "JOB_COMPLETED");
        }

        return toJobResponse(job, null, farmerId);
    }

    @Transactional
    @CacheEvict(value = {"nearbyJobs", "myJobs"}, allEntries = true)
    public JobResponse cancelJob(Long jobId, Long farmerId) {
        Job job = validateFarmerJob(jobId, farmerId);
        if (job.getStatus() == JobStatus.COMPLETED) {
            throw new BadRequestException("Cannot cancel completed job");
        }
        job.setStatus(JobStatus.CANCELLED);
        job.setUpdatedAt(LocalDateTime.now());
        jobRepository.save(job);
        return toJobResponse(job, null, farmerId);
    }

    public List<ApplicantResponse> getApplicants(Long jobId, Long farmerId) {
        validateFarmerJob(jobId, farmerId);
        return applicationRepository.findByJobIdOrderByAppliedAtDesc(jobId).stream()
                .map(this::toApplicantResponse)
                .collect(Collectors.toList());
    }

    public List<JobResponse> getFarmerHistory(Long farmerId) {
        return jobRepository.findByFarmerIdOrderByCreatedAtDesc(farmerId).stream()
                .map(j -> toJobResponse(j, null, farmerId))
                .collect(Collectors.toList());
    }

    public List<JobResponse> getLabourerHistory(Long labourerId) {
        return applicationRepository.findByLabourerIdOrderByAppliedAtDesc(labourerId).stream()
                .filter(a -> a.getStatus() == ApplicationStatus.ACCEPTED
                        || a.getJob().getStatus() == JobStatus.COMPLETED)
                .map(a -> toJobResponse(a.getJob(), null, labourerId))
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

    private JobResponse toJobResponse(Job job, BigDecimal viewerLat, Long currentUserId) {
        User farmer = job.getFarmer();
        long applicantCount = applicationRepository.countByJobId(job.getId());
        long acceptedCount = applicationRepository.countByJobIdAndStatus(job.getId(), ApplicationStatus.ACCEPTED);
        long pendingCount = applicationRepository.countByJobIdAndStatus(job.getId(), ApplicationStatus.PENDING);

        ApplicationStatus myStatus = null;
        if (currentUserId != null) {
            myStatus = applicationRepository.findByJobIdAndLabourerId(job.getId(), currentUserId)
                    .map(JobApplication::getStatus).orElse(null);
        }

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
                .farmerId(farmer.getId())
                .farmerName(farmer.getName())
                .farmerPhone(farmer.getPhone())
                .farmerRating(farmer.getRatingAvg())
                .farmerRatingCount(farmer.getRatingCount())
                .applicantCount((int) applicantCount)
                .acceptedCount((int) acceptedCount)
                .pendingCount((int) pendingCount)
                .myApplicationStatus(myStatus);

        if (viewerLat != null && job.getLatitude() != null) {
            User viewer = currentUserId != null ? userRepository.findById(currentUserId).orElse(null) : null;
            if (viewer != null && viewer.getLongitude() != null) {
                builder.distanceKm(GeoUtil.distanceKm(viewerLat, viewer.getLongitude(),
                        job.getLatitude(), job.getLongitude()));
            }
        }

        if (currentUserId != null && farmer.getId().equals(currentUserId)) {
            builder.applicants(applicationRepository.findByJobIdOrderByAppliedAtDesc(job.getId()).stream()
                    .map(this::toApplicantResponse)
                    .collect(Collectors.toList()));
        }

        return builder.build();
    }
}
