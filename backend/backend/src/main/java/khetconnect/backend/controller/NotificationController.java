package khetconnect.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import khetconnect.backend.dto.ApiResponse;
import khetconnect.backend.dto.NotificationResponse;
import khetconnect.backend.entity.User;
import khetconnect.backend.service.AuthService;
import khetconnect.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "User notifications and messaging endpoints")
public class NotificationController {

    private final NotificationService notificationService;
    private final AuthService authService;

    @GetMapping
    @SecurityRequirement(name = "bearer-jwt")
    @Operation(summary = "Get notifications", description = "Retrieve all notifications for the current user")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Notifications retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Server error")
    })
    public ApiResponse<List<NotificationResponse>> getNotifications() {
        User user = authService.getCurrentUser();
        return ApiResponse.ok(notificationService.getNotifications(user.getId()));
    }

    @PutMapping("/read")
    @SecurityRequirement(name = "bearer-jwt")
    @Operation(summary = "Mark all notifications as read", description = "Mark all unread notifications as read for current user")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "All notifications marked as read"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Server error")
    })
    public ApiResponse<Void> markAllRead() {
        User user = authService.getCurrentUser();
        notificationService.markAllAsRead(user.getId());
        return ApiResponse.ok("Marked as read", null);
    }
}
