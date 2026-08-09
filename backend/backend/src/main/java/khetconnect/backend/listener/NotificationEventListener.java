package khetconnect.backend.listener;

import khetconnect.backend.entity.Notification;
import khetconnect.backend.entity.User;
import khetconnect.backend.event.NotificationEvent;
import khetconnect.backend.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationEventListener {

    private final NotificationRepository notificationRepository;
    private final khetconnect.backend.service.NotificationService notificationService;

    @Async
    @EventListener
    public void handleNotification(NotificationEvent event) {
        User user = event.getUser();
        Notification notification = Notification.builder()
                .user(user)
                .title(event.getTitle())
                .body(event.getBody())
                .type(event.getType())
                .build();
        notificationRepository.save(notification);
        notificationService.sendPushNotification(user, event.getTitle(), event.getBody(), event.getType());
    }
}
