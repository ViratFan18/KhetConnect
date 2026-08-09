package khetconnect.backend.controller;

import khetconnect.backend.dto.ApiResponse;
import khetconnect.backend.dto.NotificationResponse;
import khetconnect.backend.entity.Notification;
import khetconnect.backend.entity.User;
import khetconnect.backend.repository.NotificationRepository;
import khetconnect.backend.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationRepository notificationRepository;
    private final AuthService authService;

    @GetMapping
    public ApiResponse<List<NotificationResponse>> getNotifications() {
        User user = authService.getCurrentUser();
        List<NotificationResponse> list = notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ApiResponse.ok(list);
    }

    @PutMapping("/read")
    @Transactional
    public ApiResponse<Void> markAllRead() {
        User user = authService.getCurrentUser();
        notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .forEach(n -> {
                    n.setRead(true);
                    notificationRepository.save(n);
                });
        return ApiResponse.ok("Marked as read", null);
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
}
