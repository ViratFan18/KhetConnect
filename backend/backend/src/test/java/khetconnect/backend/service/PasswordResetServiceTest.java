package khetconnect.backend.service;

import khetconnect.backend.dto.ForgotPasswordRequest;
import khetconnect.backend.dto.ResetPasswordRequest;
import khetconnect.backend.entity.User;
import khetconnect.backend.exception.InvalidCredentialsException;
import khetconnect.backend.repository.*;
import khetconnect.backend.security.JwtUtil;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PasswordResetServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private FarmerProfileRepository farmerProfileRepository;
    @Mock private LabourerProfileRepository labourerProfileRepository;
    @Mock private RefreshTokenRepository refreshTokenRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtUtil jwtUtil;
    @Mock private AuthenticationManager authenticationManager;

    @InjectMocks private AuthService authService;

    @Test
    void forgotPasswordCreatesResetTokenAndResetPasswordUpdatesPassword() {
        User user = User.builder()
                .id(5L)
                .phone("9876543210")
                .passwordHash("old-hash")
                .build();

        when(userRepository.findByPhone("9876543210")).thenReturn(Optional.of(user));
        when(passwordEncoder.encode("newStrongPass123")).thenReturn("new-hash");

        ForgotPasswordRequest forgotRequest = new ForgotPasswordRequest();
        forgotRequest.setPhone("9876543210");
        String token = authService.forgotPassword(forgotRequest);

        assertNotNull(token);
        assertFalse(token.isBlank());

        ResetPasswordRequest resetRequest = new ResetPasswordRequest();
        resetRequest.setToken(token);
        resetRequest.setNewPassword("newStrongPass123");

        authService.resetPassword(resetRequest);

        verify(passwordEncoder).encode("newStrongPass123");
        assertEquals("new-hash", user.getPasswordHash());
        verify(userRepository).save(user);
    }

    @Test
    void changePasswordRejectsWrongCurrentPassword() {
        User user = User.builder()
                .id(9L)
                .phone("9988776655")
                .passwordHash("current-hash")
                .build();

        when(passwordEncoder.matches("wrongPassword", "current-hash")).thenReturn(false);

        InvalidCredentialsException ex = assertThrows(InvalidCredentialsException.class,
                () -> authService.changePassword(user, "wrongPassword", "new-password"));

        assertTrue(ex.getMessage().contains("Current password"));
        verify(userRepository, never()).save(any(User.class));
    }
}
