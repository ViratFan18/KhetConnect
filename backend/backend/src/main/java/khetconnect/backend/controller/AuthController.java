package khetconnect.backend.controller;

import jakarta.validation.Valid;
import khetconnect.backend.dto.*;
import khetconnect.backend.entity.User;
import khetconnect.backend.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ApiResponse<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ApiResponse.ok("Registered successfully", authService.register(request));
    }

    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.ok("Login successful", authService.login(request));
    }

    @PostMapping("/fcm-token")
    public ApiResponse<Void> updateFcmToken(@Valid @RequestBody FcmTokenRequest request) {
        authService.updateFcmToken(request.getFcmToken());
        return ApiResponse.ok("FCM token updated", null);
    }

    @PutMapping("/location")
    public ApiResponse<Void> updateLocation(@Valid @RequestBody LocationRequest request) {
        authService.updateLocation(request);
        return ApiResponse.ok("Location updated", null);
    }

    @GetMapping("/me")
    public ApiResponse<UserProfileResponse> getMe() {
        return ApiResponse.ok(authService.getProfile());
    }

    @PutMapping("/profile")
    public ApiResponse<UserProfileResponse> updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        return ApiResponse.ok("Profile updated", authService.updateProfile(request));
    }

    @PostMapping("/refresh")
    public ApiResponse<AuthResponse> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        return ApiResponse.ok("Token refreshed", authService.refreshToken(request));
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout() {
        authService.logout();
        return ApiResponse.ok("Logged out successfully", null);
    }
}
