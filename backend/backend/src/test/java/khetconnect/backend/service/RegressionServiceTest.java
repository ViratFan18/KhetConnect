package khetconnect.backend.service;

import khetconnect.backend.dto.*;
import khetconnect.backend.entity.*;
import khetconnect.backend.event.NotificationEvent;
import khetconnect.backend.exception.BadRequestException;
import khetconnect.backend.exception.DuplicateRatingException;
import khetconnect.backend.exception.InvalidCredentialsException;
import khetconnect.backend.listener.NotificationEventListener;
import khetconnect.backend.repository.*;
import khetconnect.backend.security.JwtUtil;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RegressionServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private FarmerProfileRepository farmerProfileRepository;
    @Mock private LabourerProfileRepository labourerProfileRepository;
    @Mock private RefreshTokenRepository refreshTokenRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtUtil jwtUtil;
    @Mock private AuthenticationManager authenticationManager;
    @Mock private JobRepository jobRepository;
    @Mock private JobApplicationRepository applicationRepository;
    @Mock private RatingRepository ratingRepository;
    @Mock private NotificationRepository notificationRepository;
    @Mock private NotificationService notificationService;

    @InjectMocks private AuthService authService;
    @InjectMocks private JobService jobService;
    @InjectMocks private RatingService ratingService;

    @Test
    void applyToJobCreatesApplicationAndNotifiesFarmer() {
        User farmer = new User();
        farmer.setId(11L);
        farmer.setName("Farmer");

        User labourer = new User();
        labourer.setId(22L);
        labourer.setName("Labourer");
        labourer.setLatitude(new BigDecimal("17.1234"));
        labourer.setLongitude(new BigDecimal("78.5678"));

        Job job = new Job();
        job.setId(33L);
        job.setFarmer(farmer);
        job.setTitle("Rice Harvest");
        job.setStatus(JobStatus.OPEN);
        job.setWorkersNeeded(1);

        when(jobRepository.findById(33L)).thenReturn(Optional.of(job));
        when(userRepository.findById(22L)).thenReturn(Optional.of(labourer));
        when(applicationRepository.findByJobIdAndLabourerId(33L, 22L)).thenReturn(Optional.empty());

        jobService.applyToJob(33L, 22L);

        verify(applicationRepository).save(any(JobApplication.class));
        verify(notificationService).notifyUser(eq(farmer), eq("New Application"), eq("Labourer applied for Rice Harvest"), eq("APPLICATION"), eq(33L));
    }

    @Test
    void acceptLabourerTransitionsJobToInProgressAndNotifiesLabourer() {
        User farmer = new User();
        farmer.setId(1L);

        User labourer = new User();
        labourer.setId(2L);
        labourer.setName("Labourer");

        Job job = new Job();
        job.setId(5L);
        job.setFarmer(farmer);
        job.setTitle("Weeding");
        job.setWorkersNeeded(1);
        job.setStatus(JobStatus.OPEN);

        JobApplication app = new JobApplication();
        app.setId(77L);
        app.setJob(job);
        app.setLabourer(labourer);
        app.setStatus(ApplicationStatus.PENDING);

        when(jobRepository.findByIdWithLock(5L)).thenReturn(Optional.of(job));
        when(applicationRepository.findByJobIdAndLabourerId(5L, 2L)).thenReturn(Optional.of(app));
        when(applicationRepository.countByJobIdAndStatus(5L, ApplicationStatus.ACCEPTED)).thenReturn(0L, 1L);
        when(applicationRepository.findByJobIdOrderByAppliedAtDesc(5L)).thenReturn(List.of(app));

        JobResponse response = jobService.acceptLabourer(5L, 2L, 1L);

        assertEquals(JobStatus.IN_PROGRESS, response.getStatus());
        verify(notificationService).notifyUser(eq(labourer), eq("Application Accepted"), eq("You were accepted for Weeding"), eq("APPLICATION_ACCEPTED"), eq(5L));
    }

    @Test
    void rejectLabourerMarksApplicationRejectedAndNotifiesLabourer() {
        User farmer = new User();
        farmer.setId(1L);

        User labourer = new User();
        labourer.setId(2L);

        Job job = new Job();
        job.setId(9L);
        job.setFarmer(farmer);
        job.setTitle("Spraying");
        job.setStatus(JobStatus.OPEN);

        JobApplication app = new JobApplication();
        app.setId(88L);
        app.setJob(job);
        app.setLabourer(labourer);
        app.setStatus(ApplicationStatus.PENDING);

        when(jobRepository.findById(9L)).thenReturn(Optional.of(job));
        when(applicationRepository.findByJobIdAndLabourerId(9L, 2L)).thenReturn(Optional.of(app));
        when(applicationRepository.findByJobIdOrderByAppliedAtDesc(9L)).thenReturn(List.of(app));

        JobResponse response = jobService.rejectLabourer(9L, 2L, 1L);

        assertEquals(ApplicationStatus.REJECTED, app.getStatus());
        assertEquals(JobStatus.OPEN, response.getStatus());
        verify(notificationService).notifyUser(eq(labourer), eq("Application Rejected"), eq("Your application for Spraying was not accepted"), eq("APPLICATION_REJECTED"), eq(9L));
    }

    @Test
    void completeJobMarksJobCompleteAndRewardsAcceptedLabourers() {
        User farmer = new User();
        farmer.setId(1L);

        User labourer = new User();
        labourer.setId(2L);

        Job job = new Job();
        job.setId(10L);
        job.setFarmer(farmer);
        job.setTitle("Harvest");
        job.setStatus(JobStatus.IN_PROGRESS);

        JobApplication accepted = new JobApplication();
        accepted.setId(111L);
        accepted.setJob(job);
        accepted.setLabourer(labourer);
        accepted.setStatus(ApplicationStatus.ACCEPTED);

        LabourerProfile profile = new LabourerProfile();
        profile.setUser(labourer);
        profile.setTotalJobsDone(0);

        when(jobRepository.findById(10L)).thenReturn(Optional.of(job));
        when(applicationRepository.findByJobIdOrderByAppliedAtDesc(10L)).thenReturn(List.of(accepted));
        when(labourerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(profile));

        JobResponse response = jobService.completeJob(10L, 1L);

        assertEquals(JobStatus.COMPLETED, response.getStatus());
        assertEquals(1, profile.getTotalJobsDone());
        verify(notificationService).notifyUser(eq(labourer), eq("Job Complete!"), eq("Please rate your experience to build your profile"), eq("JOB_COMPLETED"), eq(10L));
    }

    @Test
    void loginSucceedsForActiveUserWithValidPassword() {
        User user = User.builder()
                .id(7L)
                .name("Test User")
                .phone("9876543210")
                .passwordHash("hash")
                .role(UserRole.LABOURER)
                .isActive(true)
                .build();

        LoginRequest request = new LoginRequest();
        request.setPhone("9876543210");
        request.setPassword("secret123");

        when(userRepository.findByPhone("9876543210")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("secret123", "hash")).thenReturn(true);
        when(jwtUtil.generateToken(user)).thenReturn("jwt-token");

        AuthResponse response = authService.login(request);

        assertEquals("jwt-token", response.getToken());
        assertEquals(UserRole.LABOURER, response.getRole());
        verify(authenticationManager).authenticate(any());
        verify(refreshTokenRepository).save(any(RefreshToken.class));
    }

    @Test
    void loginRejectsWrongPassword() {
        User user = User.builder()
                .id(8L)
                .phone("9999999999")
                .passwordHash("hash")
                .role(UserRole.FARMER)
                .isActive(true)
                .build();

        LoginRequest request = new LoginRequest();
        request.setPhone("9999999999");
        request.setPassword("wrong");

        when(userRepository.findByPhone("9999999999")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "hash")).thenReturn(false);

        assertThrows(InvalidCredentialsException.class, () -> authService.login(request));
    }

    @Test
    void refreshTokenRejectsExpiredToken() {
        RefreshToken refreshToken = RefreshToken.builder()
                .token("expired")
                .expiresAt(LocalDateTime.now().minusMinutes(10))
                .build();

        RefreshTokenRequest request = new RefreshTokenRequest();
        request.setRefreshToken("expired");

        when(refreshTokenRepository.findByToken("expired")).thenReturn(Optional.of(refreshToken));

        assertThrows(BadRequestException.class, () -> authService.refreshToken(request));
        verify(refreshTokenRepository).delete(refreshToken);
    }

    @Test
    void duplicateRatingIsRejectedBeforeSaving() {
        RatingRequest request = new RatingRequest();
        request.setJobId(44L);
        request.setRateeId(2L);
        request.setStars(5);

        when(ratingRepository.findByRaterIdAndJobIdWithLock(1L, 44L)).thenReturn(Optional.of(new Rating()));

        assertThrows(DuplicateRatingException.class, () -> ratingService.submitRating(1L, request));
        verify(ratingRepository, never()).save(any(Rating.class));
    }

    @Test
    void notificationListenerSavesDbRecordBeforeSendingPush() {
        User user = new User();
        user.setId(15L);
        user.setName("User");

        NotificationEvent event = NotificationEvent.builder()
                .user(user)
                .title("New Application")
                .body("Body")
                .type("APPLICATION")
                .jobId(99L)
                .build();

        Job job = new Job();
        job.setId(99L);

        when(userRepository.findById(15L)).thenReturn(Optional.of(user));
        when(jobRepository.findById(99L)).thenReturn(Optional.of(job));
        doThrow(new RuntimeException("FCM unavailable")).when(notificationService).sendPushNotification(user, "New Application", "Body", "APPLICATION");

        assertDoesNotThrow(() -> new NotificationEventListener(notificationRepository, userRepository, jobRepository, notificationService).handleNotification(event));
        verify(notificationRepository).save(any(Notification.class));
    }
}
