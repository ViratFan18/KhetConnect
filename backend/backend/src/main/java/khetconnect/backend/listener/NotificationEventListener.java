package khetconnect.backend.listener;

import khetconnect.backend.entity.Notification;
import khetconnect.backend.entity.User;
import khetconnect.backend.event.NotificationEvent;
import khetconnect.backend.repository.JobRepository;
import khetconnect.backend.repository.NotificationRepository;
import khetconnect.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationEventListener {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final JobRepository jobRepository;
    private final khetconnect.backend.service.NotificationService notificationService;

    @Async
    @EventListener
    @Transactional
    public void handleNotification(NotificationEvent event) {
        if (event == null || event.getUser() == null || event.getUser().getId() == null) {
            log.warn("Received invalid notification event: event={}", event);
            return;
        }

        Long userId = event.getUser().getId();
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            log.warn("User not found for notification event: userId={}, type={}", userId, event.getType());
            return;
        }

        try {
            // ALWAYS save notification to DB first, regardless of FCM outcome
            Notification.NotificationBuilder builder = Notification.builder()
                    .user(user)
                    .title(event.getTitle())
                    .body(event.getBody())
                    .type(event.getType());

            // Set jobId if provided (for deduplication)
            if (event.getJobId() != null) {
                jobRepository.findById(event.getJobId()).ifPresentOrElse(
                    job -> builder.job(job),
                    () -> log.warn("Job not found for notification: jobId={}, userId={}, type={}", 
                                  event.getJobId(), userId, event.getType())
                );
            }

            Notification notification = builder.build();
            notificationRepository.save(notification);
            log.info("✓ Saved notification to DB: notifId={}, userId={}, type={}, jobId={}", 
                     notification.getId(), userId, event.getType(), event.getJobId());

        } catch (DataIntegrityViolationException e) {
            // Duplicate notification (unique constraint violated) - this is expected and OK
            log.info("⊘ Duplicate notification (idempotent): userId={}, type={}, jobId={}. Reason: {}",
                     userId, event.getType(), event.getJobId(), e.getMessage());
            return;  // Don't send FCM for duplicates
        } catch (Exception e) {
            // Even if DB save fails, log it and continue to attempt FCM
            log.error("✗ Failed to save notification to DB: userId={}, type={}, jobId={}. Error: {}",
                      userId, event.getType(), event.getJobId(), e.getMessage(), e);
        }

        // Attempt to send push notification (with retry logic in NotificationService)
        try {
            log.info("Attempting FCM push: userId={}, type={}", userId, event.getType());
            notificationService.sendPushNotification(user, event.getTitle(), event.getBody(), event.getType());
        } catch (Exception e) {
            // This should rarely happen because sendPushNotification catches internally
            log.error("✗ Unexpected error sending FCM for userId={}, type={}: {}",
                      userId, event.getType(), e.getMessage(), e);
        }
    }
}
