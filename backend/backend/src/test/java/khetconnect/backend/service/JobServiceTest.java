package khetconnect.backend.service;

import khetconnect.backend.config.CacheKeys;
import khetconnect.backend.dto.JobResponse;
import khetconnect.backend.entity.*;
import khetconnect.backend.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.env.Environment;

import java.lang.reflect.Method;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JobServiceTest {

    @Mock private JobRepository jobRepository;
    @Mock private JobApplicationRepository applicationRepository;
    @Mock private UserRepository userRepository;
    @Mock private FarmerProfileRepository farmerProfileRepository;
    @Mock private LabourerProfileRepository labourerProfileRepository;
    @Mock private NotificationService notificationService;
    @Mock private Environment environment;
    @Mock private RatingRepository ratingRepository;

    @InjectMocks private JobService jobService;

    @Test
    void labourerHistoryIncludesOnlyCompletedAcceptedJobs() {
        User labourer = new User();
        labourer.setId(10L);

        User farmer = new User();
        farmer.setId(99L);

        Job completedJob = new Job();
        completedJob.setId(200L);
        completedJob.setFarmer(farmer);
        completedJob.setStatus(JobStatus.COMPLETED);

        JobApplication acceptedCompleted = new JobApplication();
        acceptedCompleted.setJob(completedJob);
        acceptedCompleted.setLabourer(labourer);
        acceptedCompleted.setStatus(ApplicationStatus.ACCEPTED);

        JobApplication pendingOpen = new JobApplication();
        pendingOpen.setJob(completedJob);
        pendingOpen.setLabourer(labourer);
        pendingOpen.setStatus(ApplicationStatus.PENDING);

        when(applicationRepository.findByLabourerIdOrderByAppliedAtDesc(10L))
                .thenReturn(List.of(acceptedCompleted, pendingOpen));

        List<JobResponse> history = jobService.getLabourerHistory(10L);

        assertEquals(1, history.size());
        assertEquals(200L, history.get(0).getId());
    }

    @Test
    void completedJobRemainsReviewableUntilCurrentUserLeavesRating() {
        User labourer = new User();
        labourer.setId(10L);

        User farmer = new User();
        farmer.setId(99L);

        Job completedJob = new Job();
        completedJob.setId(200L);
        completedJob.setFarmer(farmer);
        completedJob.setStatus(JobStatus.COMPLETED);

        JobApplication acceptedCompleted = new JobApplication();
        acceptedCompleted.setJob(completedJob);
        acceptedCompleted.setLabourer(labourer);
        acceptedCompleted.setStatus(ApplicationStatus.ACCEPTED);

        when(applicationRepository.findByLabourerIdOrderByAppliedAtDesc(10L))
                .thenReturn(List.of(acceptedCompleted));
        when(ratingRepository.existsByRaterIdAndJobId(10L, 200L)).thenReturn(false);

        List<JobResponse> history = jobService.getLabourerHistory(10L);

        assertEquals(1, history.size());
        assertFalse(history.get(0).getRatedByCurrentUser());
    }

    @Test
    void farmerHistoryMarksCurrentUserReviewStatePerJob() {
        User farmer = new User();
        farmer.setId(99L);

        User labourer = new User();
        labourer.setId(77L);
        labourer.setName("Worker A");

        Job completedJob = new Job();
        completedJob.setId(300L);
        completedJob.setFarmer(farmer);
        completedJob.setStatus(JobStatus.COMPLETED);

        JobApplication acceptedApplication = new JobApplication();
        acceptedApplication.setJob(completedJob);
        acceptedApplication.setLabourer(labourer);
        acceptedApplication.setStatus(ApplicationStatus.ACCEPTED);

        when(jobRepository.findByFarmerIdOrderByCreatedAtDesc(99L)).thenReturn(List.of(completedJob));
        when(applicationRepository.findByJobIdOrderByAppliedAtDesc(300L)).thenReturn(List.of(acceptedApplication));
        when(ratingRepository.existsByRaterIdAndJobId(99L, 300L)).thenReturn(false);

        List<JobResponse> history = jobService.getFarmerHistory(99L);

        assertEquals(1, history.size());
        assertFalse(history.get(0).getRatedByCurrentUser());
        assertNotNull(history.get(0).getApplicants());
        assertEquals(1, history.get(0).getApplicants().size());
        assertEquals(77L, history.get(0).getApplicants().get(0).getLabourerId());
    }

    @Test
    void myPostsPageUsesReadOnlyTransactionToPreventLazyInitialization() throws NoSuchMethodException {
        Method method = JobService.class.getDeclaredMethod("getMyPostsPage", Long.class, String.class, int.class);
        Transactional transactional = method.getAnnotation(Transactional.class);

        assertNotNull(transactional);
        assertTrue(transactional.readOnly());
    }

    @Test
    void myPostsPageResolvesFreshFarmerWhenJobFarmerProxyIsUninitialized() {
        User lazyFarmer = new User();
        lazyFarmer.setId(99L);
        lazyFarmer.setName("lazy");
        lazyFarmer.setPhone("9999999999");

        User freshFarmer = new User();
        freshFarmer.setId(99L);
        freshFarmer.setName("Farmer Actual");
        freshFarmer.setPhone("9876543210");
        freshFarmer.setRatingAvg(new BigDecimal("4.5"));
        freshFarmer.setRatingCount(12);

        Job job = new Job();
        job.setId(101L);
        job.setFarmer(lazyFarmer);
        job.setTitle("Rice Harvest");
        job.setStatus(JobStatus.OPEN);
        job.setVillage("Mangalagiri");

        when(jobRepository.findByFarmerIdOrderByCreatedAtDesc(99L)).thenReturn(List.of(job));
        when(userRepository.findById(99L)).thenReturn(Optional.of(freshFarmer));
        when(applicationRepository.countByJobId(101L)).thenReturn(0L);
        when(applicationRepository.countByJobIdAndStatus(101L, ApplicationStatus.ACCEPTED)).thenReturn(0L);
        when(applicationRepository.countByJobIdAndStatus(101L, ApplicationStatus.PENDING)).thenReturn(0L);

        var response = jobService.getMyPostsPage(99L, null, 20);

        assertNotNull(response);
        assertEquals(1, response.getItems().size());
        assertEquals("9876543210", response.getItems().get(0).getFarmerPhone());
        assertEquals("Farmer Actual", response.getItems().get(0).getFarmerName());
    }

    @Test
    void labourerCanCancelAcceptedOfferAndNotifyFarmer() {
        User farmer = new User();
        farmer.setId(1L);
        farmer.setName("Farmer One");

        User labourer = new User();
        labourer.setId(2L);
        labourer.setName("Labourer One");

        Job job = new Job();
        job.setId(5L);
        job.setFarmer(farmer);
        job.setTitle("Rice Harvest");
        job.setStatus(JobStatus.IN_PROGRESS);
        job.setWorkersNeeded(1);

        JobApplication application = new JobApplication();
        application.setId(77L);
        application.setJob(job);
        application.setLabourer(labourer);
        application.setStatus(ApplicationStatus.ACCEPTED);

        when(jobRepository.findById(5L)).thenReturn(Optional.of(job));
        when(applicationRepository.findByJobIdAndLabourerId(5L, 2L)).thenReturn(Optional.of(application));
        when(applicationRepository.findByJobIdOrderByAppliedAtDesc(5L)).thenReturn(List.of(application));
        when(applicationRepository.countByJobId(5L)).thenReturn(1L);
        when(applicationRepository.countByJobIdAndStatus(5L, ApplicationStatus.ACCEPTED)).thenReturn(0L);
        when(applicationRepository.countByJobIdAndStatus(5L, ApplicationStatus.PENDING)).thenReturn(0L);

        JobResponse response = jobService.cancelAcceptedApplication(5L, 2L);

        assertNotNull(response);
        assertEquals(JobStatus.OPEN, response.getStatus());
        verify(notificationService).notifyUser(eq(farmer), eq("Accepted Job Cancelled"), eq("The accepted worker withdrew from \"Rice Harvest\"."), eq("JOB_CANCELLED"));
    }

    @Test
    void nearbyJobsCacheKeyUsesCoarseLocationBucket() {
        BigDecimal lat1 = new BigDecimal("17.1234");
        BigDecimal lng1 = new BigDecimal("78.4567");
        BigDecimal lat2 = new BigDecimal("17.1249");
        BigDecimal lng2 = new BigDecimal("78.4577");

        String key1 = CacheKeys.nearbyJobsKey(lat1, lng1);
        String key2 = CacheKeys.nearbyJobsKey(lat2, lng2);

        assertEquals(key1, key2);
        assertTrue(key1.startsWith("nearbyJobs:"));
    }
}
