package khetconnect.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import khetconnect.backend.dto.*;
import khetconnect.backend.entity.User;
import khetconnect.backend.service.AuthService;
import khetconnect.backend.service.ContactService;
import khetconnect.backend.service.RatingService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Tag(name = "Ratings & Users", description = "User ratings, profiles, and feedback endpoints")
public class RatingController {

    private final RatingService ratingService;
    private final AuthService authService;
    private final ContactService contactService;

    @PostMapping("/ratings")
    @SecurityRequirement(name = "bearer-jwt")
    @Operation(summary = "Submit rating for labourer", description = "Submit a 1-5 star rating and feedback for a labourer after job completion")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Rating submitted successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid rating (must be 1-5) or already rated this labourer"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Job or labourer not found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Server error")
    })
    public ApiResponse<RatingResponse> submitRating(@Valid @RequestBody RatingRequest request) {
        User user = authService.getCurrentUser();
        return ApiResponse.ok("Rating submitted", ratingService.submitRating(user.getId(), request));
    }

    @GetMapping("/users/{id}/ratings")
    @Operation(summary = "Get labourer ratings", description = "Retrieve all ratings received by a specific labourer")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Ratings retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "User not found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Server error")
    })
    public ApiResponse<List<RatingResponse>> getUserRatings(@PathVariable Long id) {
        return ApiResponse.ok(ratingService.getRatingsForUser(id));
    }

    @GetMapping("/ratings/given")
    @SecurityRequirement(name = "bearer-jwt")
    @Operation(summary = "Get my submitted ratings", description = "Retrieve all ratings submitted by the current user")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Ratings retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Server error")
    })
    public ApiResponse<List<RatingResponse>> getMyGivenRatings() {
        User user = authService.getCurrentUser();
        return ApiResponse.ok(ratingService.getRatingsGivenByUser(user.getId()));
    }

    @GetMapping("/users/{id}/profile")
    @Operation(summary = "Get user profile", description = "Retrieve public profile information of a user including ratings and experience")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "User profile retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "User not found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Server error")
    })
    public ApiResponse<UserProfileResponse> getUserProfile(@PathVariable Long id) {
        return ApiResponse.ok(authService.getProfileById(id));
    }

    @GetMapping("/users/{id}/contact")
    @SecurityRequirement(name = "bearer-jwt")
    @Operation(summary = "Get contact details for a job participant", description = "Returns phone number only when the requester is allowed to contact the other party")
    public ApiResponse<ContactInfoResponse> getContactInfo(@PathVariable Long id) {
        User currentUser = authService.getCurrentUser();
        return ApiResponse.ok(contactService.getContactInfo(currentUser.getId(), id));
    }

    @PostMapping("/calls/log")
    @SecurityRequirement(name = "bearer-jwt")
    @Operation(summary = "Log a call between job participants", description = "Records that a party initiated a contact between accepted job participants")
    public ApiResponse<String> logCall(@Valid @RequestBody CallLogRequest request) {
        User currentUser = authService.getCurrentUser();
        contactService.logCall(currentUser.getId(), request);
        return ApiResponse.ok("Call logged successfully", "OK");
    }
}
