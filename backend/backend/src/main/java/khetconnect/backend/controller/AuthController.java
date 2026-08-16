package khetconnect.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import khetconnect.backend.dto.*;
import khetconnect.backend.entity.User;
import khetconnect.backend.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "User authentication and profile management endpoints")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Register new user", description = "Create a new user account with email, password, and role (FARMER or LABOURER)")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "User registered successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid input or email already exists"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Server error")
    })
    public ApiResponse<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ApiResponse.ok("Registered successfully", authService.register(request));
    }

    @PostMapping("/login")
    @Operation(summary = "Login user", description = "Authenticate user with email and password, returns JWT token")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Login successful, JWT token returned"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Invalid email or password"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Server error")
    })
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.ok("Login successful", authService.login(request));
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Request password reset", description = "Send password reset token to user's email")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Password reset token created and sent to email"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "User not found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Server error")
    })
    public ApiResponse<String> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        return ApiResponse.ok("Password reset token created", authService.forgotPassword(request));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Reset password", description = "Reset user password using token from email")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Password reset successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid or expired token"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Server error")
    })
    public ApiResponse<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ApiResponse.ok("Password reset successfully", null);
    }

    @PostMapping("/change-password")
    @SecurityRequirement(name = "bearer-jwt")
    @Operation(summary = "Change password", description = "Change password for authenticated user")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Password changed successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized or invalid current password"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Server error")
    })
    public ApiResponse<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        User user = authService.getCurrentUser();
        authService.changePassword(user, request.getCurrentPassword(), request.getNewPassword());
        return ApiResponse.ok("Password changed successfully", null);
    }

    @PostMapping("/fcm-token")
    @SecurityRequirement(name = "bearer-jwt")
    @Operation(summary = "Update FCM token", description = "Update Firebase Cloud Messaging token for push notifications")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "FCM token updated successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Server error")
    })
    public ApiResponse<Void> updateFcmToken(@Valid @RequestBody FcmTokenRequest request) {
        authService.updateFcmToken(request.getFcmToken());
        return ApiResponse.ok("FCM token updated", null);
    }

    @PutMapping("/location")
    @SecurityRequirement(name = "bearer-jwt")
    @Operation(summary = "Update user location", description = "Update user's current latitude and longitude for geolocation-based job matching")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Location updated successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid location coordinates"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Server error")
    })
    public ApiResponse<Void> updateLocation(@Valid @RequestBody LocationRequest request) {
        authService.updateLocation(request);
        return ApiResponse.ok("Location updated", null);
    }

    @GetMapping("/me")
    @SecurityRequirement(name = "bearer-jwt")
    @Operation(summary = "Get current user profile", description = "Retrieve authenticated user's profile information")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "User profile retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Server error")
    })
    public ApiResponse<UserProfileResponse> getMe() {
        return ApiResponse.ok(authService.getProfile());
    }

    @PutMapping("/profile")
    @SecurityRequirement(name = "bearer-jwt")
    @Operation(summary = "Update user profile", description = "Update user's profile information (name, phone, experience, etc.)")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Profile updated successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid input"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Server error")
    })
    public ApiResponse<UserProfileResponse> updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        return ApiResponse.ok("Profile updated", authService.updateProfile(request));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh JWT token", description = "Get a new JWT token using refresh token")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Token refreshed successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Invalid or expired refresh token"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Server error")
    })
    public ApiResponse<AuthResponse> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        return ApiResponse.ok("Token refreshed", authService.refreshToken(request));
    }

    @PostMapping("/logout")
    @SecurityRequirement(name = "bearer-jwt")
    @Operation(summary = "Logout user", description = "Invalidate current JWT token and refresh token")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Logged out successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Server error")
    })
    public ApiResponse<Void> logout() {
        authService.logout();
        return ApiResponse.ok("Logged out successfully", null);
    }
}
