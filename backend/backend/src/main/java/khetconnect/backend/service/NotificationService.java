package khetconnect.backend.service;

import khetconnect.backend.dto.NotificationResponse;
import khetconnect.backend.entity.Notification;
import khetconnect.backend.entity.User;
import khetconnect.backend.event.NotificationEvent;
import khetconnect.backend.repository.NotificationRepository;
import khetconnect.backend.repository.UserRepository;
import khetconnect.backend.util.BusinessEventLogger;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.MessagingErrorCode;
import com.google.firebase.messaging.Message;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final ApplicationEventPublisher eventPublisher;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;

    @Value("${khetconnect.fcm.enabled:false}")
    private boolean fcmEnabled;

    public void notifyUser(User user, String title, String body, String type) {
        notifyUser(user, title, body, type, null);
    }

    public void notifyUser(User user, String title, String body, String type, Long jobId) {
        eventPublisher.publishEvent(NotificationEvent.builder()
                .user(user)
                .title(title)
                .body(body)
                .type(type)
                .jobId(jobId)
                .build());
    }

    @Transactional
    public List<NotificationResponse> getNotifications(Long userId) {
        List<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);

        if (notifications.size() > 5) {
            List<Notification> staleNotifications = notifications.subList(5, notifications.size());
            notificationRepository.deleteAll(staleNotifications);
            notifications = notifications.subList(0, 5);
        }

        return notifications.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        List<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        notifications.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(notifications);
    }

    private NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .title(n.getTitle())
                .body(n.getBody())
                .type(n.getType())
                .read(n.getRead())
                .createdAt(n.getCreatedAt())
                .build();
    }

    public void sendPushNotification(User user, String title, String body, String type) {
        sendPushNotificationWithRetry(user, title, body, type, 0);
    }

    private void sendPushNotificationWithRetry(User user, String title, String body, String type, int attemptNumber) {
        if (!fcmEnabled || user == null || user.getId() == null) {
            return;
        }

        User freshUser = userRepository.findById(user.getId()).orElse(user);
        String fcmToken = freshUser.getFcmToken();
        if (fcmToken == null || fcmToken.isBlank()) {
            return;
        }

        try {
            Message message = Message.builder()
                    .setToken(fcmToken)
                    .setNotification(com.google.firebase.messaging.Notification.builder().setTitle(title).setBody(body).build())
                    .putData("type", type)
                    .build();

            log.info("Sending FCM message to user {} (type={}, attempt={})", user.getId(), type, attemptNumber + 1);
            String resp = FirebaseMessaging.getInstance().send(message);
            log.info("FCM message sent successfully: {} to user {} (type={})", resp, user.getId(), type);
        } catch (FirebaseMessagingException e) {
            MessagingErrorCode code = e.getMessagingErrorCode();
            boolean isRetryable = code == MessagingErrorCode.INTERNAL ||
                                  code == MessagingErrorCode.UNAVAILABLE ||
                                  code == MessagingErrorCode.THIRD_PARTY_AUTH_ERROR;
            boolean isUnrecoverable = code == MessagingErrorCode.UNREGISTERED ||
                                     code == MessagingErrorCode.INVALID_ARGUMENT;

            if (isUnrecoverable) {
                log.warn("FCM send failed with unrecoverable error for user {}: messagingErrorCode={}. Clearing FCM token.", 
                         user.getId(), code);
                try {
                    user.setFcmToken(null);
                    userRepository.save(user);
                    log.warn("Cleared fcmToken for user {} due to FCM error {}", user.getId(), code);
                } catch (Exception ex) {
                    log.warn("Error while clearing FCM token for user {}: {}", user.getId(), ex.getMessage());
                }
            } else if (isRetryable && attemptNumber < 3) {
                // Exponential backoff: 1s, 2s, 4s
                long backoffMs = (long) Math.pow(2, attemptNumber) * 1000L;
                log.warn("FCM send failed (retryable) for user {}: messagingErrorCode={}. Retrying in {}ms (attempt {}/3)", 
                         user.getId(), code, backoffMs, attemptNumber + 1);
                
                scheduleRetry(user, title, body, type, attemptNumber + 1, backoffMs);
            } else {
                log.error("FCM send failed for user {} after {} attempts: messagingErrorCode={}. type={}", 
                          user.getId(), attemptNumber + 1, code, type);
                BusinessEventLogger.notificationSendFailed(user.getId(), type, 
                    "FCM error: " + code + " after " + (attemptNumber + 1) + " attempts");
            }

            // Try to clear invalid token if needed
            try {
                if (code == MessagingErrorCode.UNREGISTERED || code == MessagingErrorCode.INVALID_ARGUMENT) {
                    user.setFcmToken(null);
                    userRepository.save(user);
                    log.warn("Cleared invalid fcmToken for user {} due to FCM error {}", user.getId(), code);
                }
            } catch (Exception ex) {
                log.warn("Error while handling FCM error cleanup: {}", ex.getMessage());
            }
        } catch (Exception e) {
            if (attemptNumber < 3) {
                long backoffMs = (long) Math.pow(2, attemptNumber) * 1000L;
                log.warn("Unexpected error sending FCM notification for user {} (attempt {}/3). Retrying in {}ms: {}", 
                         user.getId(), attemptNumber + 1, backoffMs, e.getMessage());
                scheduleRetry(user, title, body, type, attemptNumber + 1, backoffMs);
            } else {
                log.error("Unable to send FCM notification for user {} after {} attempts: {}", 
                          user.getId(), attemptNumber + 1, e.getMessage(), e);
            }
        }
    }

    private void scheduleRetry(User user, String title, String body, String type, int nextAttempt, long delayMs) {
        // Schedule retry asynchronously with exponential backoff
        scheduleRetryAsync(user, title, body, type, nextAttempt, delayMs);
    }

    @Async
    private void scheduleRetryAsync(User user, String title, String body, String type, int nextAttempt, long delayMs) {
        try {
            Thread.sleep(delayMs);
            sendPushNotificationWithRetry(user, title, body, type, nextAttempt);
        } catch (InterruptedException ie) {
            log.warn("Retry thread interrupted for user {}: {}", user.getId(), ie.getMessage());
            Thread.currentThread().interrupt();
        }
    }
}
