package khetconnect.backend.controller;

import jakarta.validation.Valid;
import khetconnect.backend.dto.*;
import khetconnect.backend.entity.User;
import khetconnect.backend.service.AuthService;
import khetconnect.backend.service.JobService;
import khetconnect.backend.service.RatingService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class RatingController {

    private final RatingService ratingService;
    private final AuthService authService;

    @PostMapping("/ratings")
    public ApiResponse<RatingResponse> submitRating(@Valid @RequestBody RatingRequest request) {
        User user = authService.getCurrentUser();
        return ApiResponse.ok("Rating submitted", ratingService.submitRating(user.getId(), request));
    }

    @GetMapping("/users/{id}/ratings")
    public ApiResponse<List<RatingResponse>> getUserRatings(@PathVariable Long id) {
        return ApiResponse.ok(ratingService.getRatingsForUser(id));
    }

    @GetMapping("/ratings/given")
    public ApiResponse<List<RatingResponse>> getMyGivenRatings() {
        User user = authService.getCurrentUser();
        return ApiResponse.ok(ratingService.getRatingsGivenByUser(user.getId()));
    }

    @GetMapping("/users/{id}/profile")
    public ApiResponse<UserProfileResponse> getUserProfile(@PathVariable Long id) {
        return ApiResponse.ok(authService.getProfileById(id));
    }
}
