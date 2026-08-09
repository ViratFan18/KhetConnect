package khetconnect.backend.service;

import khetconnect.backend.dto.*;
import khetconnect.backend.entity.*;
import khetconnect.backend.exception.AccountLockedException;
import khetconnect.backend.exception.BadRequestException;
import khetconnect.backend.exception.DuplicatePhoneException;
import khetconnect.backend.exception.InvalidCredentialsException;
import khetconnect.backend.exception.UserNotRegisteredException;
import khetconnect.backend.repository.FarmerProfileRepository;
import khetconnect.backend.repository.LabourerProfileRepository;
import khetconnect.backend.repository.RefreshTokenRepository;
import khetconnect.backend.repository.UserRepository;
import khetconnect.backend.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final FarmerProfileRepository farmerProfileRepository;
    private final LabourerProfileRepository labourerProfileRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    @Value("${khetconnect.jwt.refresh-expiry-ms:604800000}")
    private long refreshExpiryMs;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByPhone(request.getPhone())) {
            throw new DuplicatePhoneException("Phone number already exists. Please use another number or login instead.");
        }
        if (request.getRole() == null || (request.getRole() != UserRole.FARMER && request.getRole() != UserRole.LABOURER)) {
            throw new BadRequestException("Role must be FARMER or LABOURER");
        }

        User user = User.builder()
                .name(request.getName())
                .phone(request.getPhone())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .build();
        user = userRepository.save(user);

        if (request.getRole() == UserRole.FARMER) {
            FarmerProfile profile = FarmerProfile.builder()
                    .user(user)
                    .village(request.getVillage())
                    .build();
            farmerProfileRepository.save(profile);
            user.setFarmerProfile(profile);
        } else {
            String skills = request.getSkills() != null
                    ? String.join(",", request.getSkills()) : "";
            LabourerProfile profile = LabourerProfile.builder()
                    .user(user)
                    .skills(skills)
                    .dailyWageExpected(request.getDailyWageExpected() != null ? request.getDailyWageExpected() : 0)
                    .build();
            labourerProfileRepository.save(profile);
            user.setLabourerProfile(profile);
        }

        String token = jwtUtil.generateToken(user);
        return AuthResponse.builder()
                .token(token)
                .refreshToken(createRefreshToken(user))
                .userId(user.getId())
                .role(user.getRole())
                .name(user.getName())
                .build();
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByPhone(request.getPhone())
                .orElseThrow(() -> new UserNotRegisteredException("This number is not registered. Please register first."));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new InvalidCredentialsException("Phone number or password is incorrect. Please try again.");
        }
        if (Boolean.FALSE.equals(user.getIsActive())) {
            throw new AccountLockedException("Your account is temporarily locked. Contact support.");
        }

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getPhone(), request.getPassword()));
        String token = jwtUtil.generateToken(user);
        return AuthResponse.builder()
                .token(token)
                .refreshToken(createRefreshToken(user))
                .userId(user.getId())
                .role(user.getRole())
                .name(user.getName())
                .build();
    }

    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(request.getRefreshToken())
                .orElseThrow(() -> new BadRequestException("Invalid refresh token"));
        if (refreshToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            refreshTokenRepository.delete(refreshToken);
            throw new BadRequestException("Refresh token expired");
        }
        User user = refreshToken.getUser();
        refreshTokenRepository.delete(refreshToken);
        return AuthResponse.builder()
                .token(jwtUtil.generateToken(user))
                .refreshToken(createRefreshToken(user))
                .userId(user.getId())
                .role(user.getRole())
                .name(user.getName())
                .build();
    }

    public User getCurrentUser() {
        String phone = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByPhone(phone)
                .orElseThrow(() -> new BadRequestException("User not found"));
    }

    @Transactional
    public void updateFcmToken(String fcmToken) {
        User user = getCurrentUser();
        user.setFcmToken(fcmToken);
        userRepository.save(user);
    }

    @Transactional
    public void updateLocation(LocationRequest request) {
        User user = getCurrentUser();
        user.setLatitude(request.getLatitude());
        user.setLongitude(request.getLongitude());
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
    }

    @Transactional
    public void logout() {
        User user = getCurrentUser();
        refreshTokenRepository.deleteByUser(user);
    }

    public UserProfileResponse getProfile() {
        User user = getCurrentUser();
        return toProfileResponse(user);
    }

    @Transactional
    public UserProfileResponse updateProfile(UpdateProfileRequest request) {
        User user = getCurrentUser();
        if (request.getName() != null) user.setName(request.getName());
        if (request.getLanguagePref() != null) user.setLanguagePref(request.getLanguagePref());
        user.setUpdatedAt(LocalDateTime.now());

        if (user.getRole() == UserRole.FARMER && request.getVillage() != null) {
            FarmerProfile profile = farmerProfileRepository.findByUserId(user.getId())
                    .orElseGet(() -> {
                        FarmerProfile p = FarmerProfile.builder().user(user).build();
                        return farmerProfileRepository.save(p);
                    });
            profile.setVillage(request.getVillage());
            farmerProfileRepository.save(profile);
        }

        if (user.getRole() == UserRole.LABOURER) {
            LabourerProfile profile = labourerProfileRepository.findByUserId(user.getId())
                    .orElseGet(() -> {
                        LabourerProfile p = LabourerProfile.builder().user(user).build();
                        return labourerProfileRepository.save(p);
                    });
            if (request.getVillage() != null) profile.setSkills(profile.getSkills());
            if (request.getSkills() != null) profile.setSkills(String.join(",", request.getSkills()));
            if (request.getDailyWageExpected() != null) profile.setDailyWageExpected(request.getDailyWageExpected());
            labourerProfileRepository.save(profile);
        }

        userRepository.save(user);
        return toProfileResponse(user);
    }

    private String createRefreshToken(User user) {
        refreshTokenRepository.deleteByUser(user);
        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(UUID.randomUUID().toString())
                .expiresAt(LocalDateTime.now().plusSeconds(refreshExpiryMs / 1000))
                .build();
        refreshTokenRepository.save(refreshToken);
        return refreshToken.getToken();
    }

    public UserProfileResponse getProfileById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("User not found"));
        return toProfileResponse(user);
    }

    public UserProfileResponse toProfileResponse(User user) {
        String village = null;
        List<String> skills = Collections.emptyList();
        Integer dailyWage = null;
        int totalJobs = 0;

        if (user.getRole() == UserRole.FARMER) {
            FarmerProfile fp = farmerProfileRepository.findByUserId(user.getId()).orElse(null);
            if (fp != null) {
                village = fp.getVillage();
                totalJobs = fp.getTotalJobsPosted() != null ? fp.getTotalJobsPosted() : 0;
            }
        } else if (user.getRole() == UserRole.LABOURER) {
            LabourerProfile lp = labourerProfileRepository.findByUserId(user.getId()).orElse(null);
            if (lp != null) {
                if (lp.getSkills() != null && !lp.getSkills().isBlank()) {
                    skills = Arrays.asList(lp.getSkills().split(","));
                }
                dailyWage = lp.getDailyWageExpected();
                totalJobs = lp.getTotalJobsDone() != null ? lp.getTotalJobsDone() : 0;
            }
        }

        return UserProfileResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .phone(user.getPhone())
                .role(user.getRole())
                .village(village)
                .skills(skills)
                .dailyWageExpected(dailyWage)
                .ratingAvg(user.getRatingAvg())
                .ratingCount(user.getRatingCount())
                .totalJobs(totalJobs)
                .languagePref(user.getLanguagePref())
                .latitude(user.getLatitude())
                .longitude(user.getLongitude())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
