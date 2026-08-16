package khetconnect.backend.service;

import khetconnect.backend.dto.*;
import khetconnect.backend.entity.*;
import khetconnect.backend.exception.BadRequestException;
import khetconnect.backend.exception.ResourceNotFoundException;
import khetconnect.backend.exception.JobAlreadyFullException;
import khetconnect.backend.exception.AlreadyAppliedException;
import khetconnect.backend.exception.DuplicateRatingException;
import khetconnect.backend.repository.*;
import khetconnect.backend.util.BusinessEventLogger;
import khetconnect.backend.util.GeoUtil;
import khetconnect.backend.util.PiiMasker;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.core.env.Environment;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
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
    private final Environment environment;
    private final RatingRepository ratingRepository;

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

        BusinessEventLogger.jobPosted(job.getId(), farmerId, 
            job.getWorkType() != null ? job.getWorkType().toString() : "OTHER",
            job.getVillage());
        
        notifyNearbyLabourers(job);
        return buildJobResponse(job, null, null, null);
    }

    @Async
    public void notifyNearbyLabourers(Job job) {
        List<User> labourers = userRepository.findActiveByRole(UserRole.LABOURER);
        for (User labourer : labourers) {
            if (GeoUtil.withinKm(job.getLatitude(), job.getLongitude(),
                    labourer.getLatitude(), labourer.getLongitude(), NEARBY_RADIUS_KM)) {
                String title = "Work Available - " + (job.getVillage() != null ? job.getVillage() : "Nearby");
                String body = job.getWorkType() + " | Rs." + job.getWagePerDay() + "/day | " + job.getWorkDate();
                notificationService.notifyUser(labourer, title, body, "JOB_POSTED", job.getId());
            }
        }
    }

    @Transactional(readOnly = true)
    @Cacheable("myJobs")
    public List<JobResponse> getMyPosts(Long farmerId) {
        return jobRepository.findByFarmerIdOrderByCreatedAtDesc(farmerId).stream()
                .map(j -> toJobResponse(j, null, farmerId))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CursorPageResponse<JobResponse> getMyPostsPage(Long farmerId, String cursor, int pageSize) {
        int effectivePageSize = Math.max(1, Math.min(pageSize, 20));
        Pageable pageable = PageRequest.of(0, effectivePageSize, Sort.by(Sort.Direction.DESC, "createdAt"));
        List<Job> jobs = jobRepository.findByFarmerIdOrderByCreatedAtDesc(farmerId);

        String nextCursor = null;
        List<JobResponse> items = jobs.stream()
                .skip(cursor == null ? 0 : parseCursor(cursor))
                .limit(effectivePageSize)
                .map(j -> toJobResponse(j, null, farmerId))
                .collect(Collectors.toList());

        if (items.size() == effectivePageSize && hasMoreJobs(jobs, cursor, effectivePageSize)) {
            nextCursor = String.valueOf(parseCursor(cursor) + effectivePageSize);
        }

        return CursorPageResponse.<JobResponse>builder()
                .items(items)
                .nextCursor(nextCursor)
                .pageSize(effectivePageSize)
                .build();
    }

    @Transactional(readOnly = true)
    @Cacheable(cacheNames = "nearbyJobs", key = "T(khetconnect.backend.config.CacheKeys).nearbyJobsKey(#lat, #lng)")
    public List<JobResponse> getNearbyJobs(BigDecimal lat, BigDecimal lng, Long labourerId) {
        if (lat == null || lng == null) {
            return List.of();
        }

        if (usePostgresSpatialLookup()) {
            return getNearbyJobsWithSpatialIndex(lat, lng, labourerId);
        }

        return getNearbyJobsLegacy(lat, lng, labourerId);
    }

    @Transactional(readOnly = true)
    public CursorPageResponse<JobResponse> getNearbyJobsPage(BigDecimal lat, BigDecimal lng, Long labourerId, String cursor, int pageSize) {
        if (lat == null || lng == null) {
            return CursorPageResponse.<JobResponse>builder().items(List.of()).nextCursor(null).pageSize(Math.max(1, Math.min(pageSize, 20))).build();
        }

        List<JobResponse> source = getNearbyJobs(lat, lng, labourerId);
        int effectivePageSize = Math.max(1, Math.min(pageSize, 20));
        int startIndex = cursor == null ? 0 : Math.max(0, Integer.parseInt(cursor));
        int endIndex = Math.min(startIndex + effectivePageSize, source.size());

        List<JobResponse> items = source.subList(startIndex, endIndex);
        String nextCursor = endIndex < source.size() ? String.valueOf(endIndex) : null;

        return CursorPageResponse.<JobResponse>builder()
                .items(items)
                .nextCursor(nextCursor)
                .pageSize(effectivePageSize)
                .build();
    }

    private boolean usePostgresSpatialLookup() {
        return Arrays.stream(environment.getActiveProfiles())
                .anyMatch(profile -> "postgres".equalsIgnoreCase(profile));
    }

    private List<JobResponse> getNearbyJobsLegacy(BigDecimal lat, BigDecimal lng, Long labourerId) {
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

    private List<JobResponse> getNearbyJobsWithSpatialIndex(BigDecimal lat, BigDecimal lng, Long labourerId) {
        double radiusMeters = NEARBY_RADIUS_KM * 1000.0;
        return jobRepository.findNearbyJobsWithDistance(lat, lng, radiusMeters, JobStatus.OPEN.name()).stream()
                .map(row -> {
                    String farmerPhone = shouldRevealPhoneForJobViewer(labourerId, row.getFarmerId(), row.getId())
                            ? row.getFarmerPhone()
                            : PiiMasker.maskPhone(row.getFarmerPhone());

                    JobResponse.JobResponseBuilder builder = JobResponse.builder()
                            .id(row.getId())
                            .title(row.getTitle())
                            .description(row.getDescription())
                            .workType(row.getWorkType() == null ? null : WorkType.valueOf(row.getWorkType()))
                            .cropType(row.getCropType())
                            .wagePerDay(row.getWagePerDay())
                            .workersNeeded(row.getWorkersNeeded())
                            .workDate(row.getWorkDate())
                            .latitude(row.getLatitude())
                            .longitude(row.getLongitude())
                            .village(row.getVillage())
                            .status(row.getStatus() == null ? null : JobStatus.valueOf(row.getStatus()))
                            .createdAt(row.getCreatedAt())
                            .farmerId(row.getFarmerId())
                            .farmerName(row.getFarmerName())
                            .farmerPhone(farmerPhone)
                            .farmerRating(row.getFarmerRating())
                            .farmerRatingCount(row.getFarmerRatingCount())
                            .distanceKm(row.getDistanceKm())
                            .applicantCount((int) applicationRepository.countByJobId(row.getId()))
                            .acceptedCount((int) applicationRepository.countByJobIdAndStatus(row.getId(), ApplicationStatus.ACCEPTED))
                            .pendingCount((int) applicationRepository.countByJobIdAndStatus(row.getId(), ApplicationStatus.PENDING));

                    if (labourerId != null) {
                        builder.myApplicationStatus(applicationRepository.findByJobIdAndLabourerId(row.getId(), labourerId)
                                .map(JobApplication::getStatus).orElse(null));
                    }

                    return builder.build();
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public JobResponse getJobById(Long jobId, Long currentUserId) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job not found"));
        User current = userRepository.findById(currentUserId).orElseThrow();
        BigDecimal lat = current.getLatitude();
        
        List<JobApplication> applicantsToInclude = null;
        if (current.getRole() == UserRole.FARMER && job.getFarmer().getId().equals(currentUserId)) {
            applicantsToInclude = applicationRepository.findByJobIdOrderByAppliedAtDesc(job.getId());
        }
        
        return buildJobResponse(job, lat, currentUserId, applicantsToInclude);
    }

    private boolean hasMoreJobs(List<Job> jobs, String cursor, int pageSize) {
        int start = cursor == null ? 0 : Math.max(0, parseCursor(cursor));
        return jobs.size() > start + pageSize;
    }

    private int parseCursor(String cursor) {
        try {
            return Integer.parseInt(cursor);
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    private Job getJobForWrite(Long jobId) {
        return jobRepository.findByIdWithLock(jobId)
                .or(() -> jobRepository.findById(jobId))
                .orElseThrow(() -> new ResourceNotFoundException("Job not found"));
    }

    @Transactional
    public JobResponse applyToJob(Long jobId, Long labourerId) {
        // Pessimistic lock ensures no race conditions with concurrent applies/accepts
        Job job = getJobForWrite(jobId);
        
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

        return buildJobResponse(job, labourer.getLatitude(), labourerId, null);
    }

    @Transactional
    @CacheEvict(value = {"nearbyJobs", "myJobs"}, allEntries = true)
    public JobResponse acceptLabourer(Long jobId, Long labourerId, Long farmerId) {
        // Pessimistic lock ensures accept operations are atomic and don't exceed workersNeeded
        Job job = getJobForWrite(jobId);
        
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
        return buildJobResponse(job, null, farmerId, applicants);
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
        
        BusinessEventLogger.applicationRejected(jobId, labourerId, farmerId);
        
        // Send rejection notification to labourer with jobId for idempotency
        notificationService.notifyUser(app.getLabourer(),
                "Application Rejected",
                "Your application for " + job.getTitle() + " was not accepted",
                "APPLICATION_REJECTED",
                jobId);
        
        List<JobApplication> applicants = applicationRepository.findByJobIdOrderByAppliedAtDesc(jobId);
        return buildJobResponse(job, null, farmerId, applicants);
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

        // Fetch all applicants first (within same transaction)
        List<JobApplication> applicants = applicationRepository.findByJobIdOrderByAppliedAtDesc(jobId);
        List<JobApplication> accepted = applicants.stream()
                .filter(a -> a.getStatus() == ApplicationStatus.ACCEPTED)
                .toList();

        job.setStatus(JobStatus.COMPLETED);
        job.setUpdatedAt(LocalDateTime.now());
        jobRepository.save(job);

        BusinessEventLogger.jobCompleted(jobId, farmerId, (int) accepted.size());
        
        // Send JOB_COMPLETED notification with jobId for idempotency
        // Unique constraint (user_id, job_id, type) prevents duplicate notifications
        for (JobApplication app : accepted) {
            labourerProfileRepository.findByUserId(app.getLabourer().getId()).ifPresent(lp -> {
                lp.setTotalJobsDone(lp.getTotalJobsDone() + 1);
                labourerProfileRepository.save(lp);
            });
            notificationService.notifyUser(app.getLabourer(),
                    "Job Complete!",
                    "Please rate your experience to build your profile",
                    "JOB_COMPLETED",
                    jobId);
        }

        return buildJobResponse(job, null, farmerId, applicants);
    }

    @Transactional
    @CacheEvict(value = {"nearbyJobs", "myJobs"}, allEntries = true)
    public JobResponse cancelJob(Long jobId, Long farmerId) {
        Job job = validateFarmerJob(jobId, farmerId);
        if (job.getStatus() == JobStatus.COMPLETED) {
            throw new BadRequestException("Cannot cancel completed job");
        }

        List<JobApplication> applicants = applicationRepository.findByJobIdOrderByAppliedAtDesc(jobId);
        List<JobApplication> acceptedApplicants = applicants.stream()
                .filter(app -> app.getStatus() == ApplicationStatus.ACCEPTED)
                .toList();

        job.setStatus(JobStatus.CANCELLED);
        job.setUpdatedAt(LocalDateTime.now());
        jobRepository.save(job);

        for (JobApplication acceptedApp : acceptedApplicants) {
            notificationService.notifyUser(
                    acceptedApp.getLabourer(),
                    "Job Cancelled",
                    "The job \"" + job.getTitle() + "\" was cancelled by the farmer.",
                    "JOB_CANCELLED",
                    jobId
            );
        }

        return buildJobResponse(job, null, farmerId, applicants);
    }

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

        return buildJobResponse(job, null, null, applicationRepository.findByJobIdOrderByAppliedAtDesc(jobId));
    }

    public List<ApplicantResponse> getApplicants(Long jobId, Long farmerId) {
        validateFarmerJob(jobId, farmerId);
        return applicationRepository.findByJobIdOrderByAppliedAtDesc(jobId).stream()
                .map(this::toApplicantResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<JobResponse> getFarmerHistory(Long farmerId) {
        return jobRepository.findByFarmerIdOrderByCreatedAtDesc(farmerId).stream()
                .filter(job -> job.getStatus() == JobStatus.COMPLETED)
                .map(job -> {
                    List<JobApplication> applicants = applicationRepository.findByJobIdOrderByAppliedAtDesc(job.getId());
                    return buildJobResponse(job, null, farmerId, applicants);
                })
                .map(response -> {
                    if (response.getStatus() == JobStatus.COMPLETED) {
                        response.setRatedByCurrentUser(ratingRepository.existsByRaterIdAndJobId(farmerId, response.getId()));
                    }
                    return response;
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<JobResponse> getLabourerHistory(Long labourerId) {
        return applicationRepository.findByLabourerIdOrderByAppliedAtDesc(labourerId).stream()
                .filter(app -> app.getStatus() == ApplicationStatus.ACCEPTED)
                .map(JobApplication::getJob)
                .filter(job -> job.getStatus() == JobStatus.COMPLETED)
                .map(job -> toJobResponse(job, null, labourerId))
                .collect(Collectors.toList());
    }

    private Job validateFarmerJob(Long jobId, Long farmerId) {
        Job job = getJobForWrite(jobId);
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

    private User resolveFarmer(Job job) {
        if (job == null) {
            return null;
        }

        User directFarmer = job.getFarmer();
        if (directFarmer == null) {
            return null;
        }

        Long farmerId = directFarmer.getId();
        if (farmerId == null) {
            return null;
        }

        return userRepository.findById(farmerId).orElse(null);
    }

    private JobResponse buildJobResponse(Job job, BigDecimal viewerLat, Long currentUserId, List<JobApplication> applicantsToInclude) {
        User farmer = resolveFarmer(job);
        long applicantCount = applicationRepository.countByJobId(job.getId());
        long acceptedCount = applicationRepository.countByJobIdAndStatus(job.getId(), ApplicationStatus.ACCEPTED);
        long pendingCount = applicationRepository.countByJobIdAndStatus(job.getId(), ApplicationStatus.PENDING);

        ApplicationStatus myStatus = null;
        if (currentUserId != null) {
            myStatus = applicationRepository.findByJobIdAndLabourerId(job.getId(), currentUserId)
                    .map(JobApplication::getStatus).orElse(null);
        }

        String farmerPhone = farmer != null && farmer.getPhone() != null ? farmer.getPhone() : null;
        String visibleFarmerPhone = farmer == null
                ? null
                : (shouldRevealPhoneForJobViewer(currentUserId, farmer.getId(), job.getId())
                    ? farmerPhone
                    : PiiMasker.maskPhone(farmerPhone));

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
                .farmerId(farmer != null ? farmer.getId() : null)
                .farmerName(farmer != null ? farmer.getName() : null)
                .farmerPhone(visibleFarmerPhone)
                .farmerRating(farmer != null ? farmer.getRatingAvg() : null)
                .farmerRatingCount(farmer != null ? farmer.getRatingCount() : null)
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

        if (applicantsToInclude != null && !applicantsToInclude.isEmpty()) {
            builder.applicants(applicantsToInclude.stream()
                    .map(this::toApplicantResponse)
                    .collect(Collectors.toList()));
        }

        return builder.build();
    }

    private boolean shouldRevealPhoneForJobViewer(Long viewerUserId, Long ownerUserId, Long jobId) {
        if (viewerUserId == null) {
            return false;
        }
        if (viewerUserId.equals(ownerUserId)) {
            return true;
        }
        return applicationRepository.findByJobIdAndLabourerId(jobId, viewerUserId)
                .map(JobApplication::getStatus)
                .filter(status -> status == ApplicationStatus.ACCEPTED)
                .isPresent();
    }

    private JobResponse toJobResponse(Job job, BigDecimal viewerLat, Long currentUserId) {
        // For backward compatibility with cached methods, don't include applicants
        JobResponse response = buildJobResponse(job, viewerLat, currentUserId, null);
        
        // Add review status for completed jobs, scoped to the current viewer
        if (currentUserId != null && job.getStatus() == JobStatus.COMPLETED) {
            boolean ratedByUser = ratingRepository.existsByRaterIdAndJobId(currentUserId, job.getId());
            response.setRatedByCurrentUser(ratedByUser);
        }
        
        return response;
    }
}
