package khetconnect.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import khetconnect.backend.entity.User;
import khetconnect.backend.event.NotificationEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private static final String FCM_URL = "https://fcm.googleapis.com/fcm/send";

    private final ObjectMapper objectMapper;
    private final ApplicationEventPublisher eventPublisher;

    @Value("${khetconnect.fcm.server-key:}")
    private String fcmServerKey;

    public void notifyUser(User user, String title, String body, String type) {
        eventPublisher.publishEvent(NotificationEvent.builder()
                .user(user)
                .title(title)
                .body(body)
                .type(type)
                .build());
    }

    public void sendPushNotification(User user, String title, String body, String type) {
        if (fcmServerKey == null || fcmServerKey.isBlank()) {
            return;
        }
        if (user.getFcmToken() == null || user.getFcmToken().isBlank()) {
            return;
        }

        try {
            Map<String, Object> notificationMap = new HashMap<>();
            notificationMap.put("title", title);
            notificationMap.put("body", body);

            Map<String, Object> message = new HashMap<>();
            message.put("to", user.getFcmToken());
            message.put("notification", notificationMap);
            message.put("data", Map.of("type", type));

            String requestBody = objectMapper.writeValueAsString(message);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(FCM_URL))
                    .header("Content-Type", "application/json; charset=UTF-8")
                    .header("Authorization", "key=" + fcmServerKey)
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody, StandardCharsets.UTF_8))
                    .build();
            HttpClient.newHttpClient().send(request, HttpResponse.BodyHandlers.discarding());
        } catch (Exception e) {
            log.warn("Unable to send FCM notification", e);
        }
    }
}
