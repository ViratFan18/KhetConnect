package khetconnect.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import khetconnect.backend.dto.*;
import khetconnect.backend.entity.User;
import khetconnect.backend.service.AuthService;
import khetconnect.backend.service.JobService;
import khetconnect.backend.service.JobApplicationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/jobs")
@RequiredArgsConstructor
@Tag(name = "Jobs", description = "Job posting, searching, and management endpoints")
public class JobController {

    private final JobService jobService;
    private final JobApplicationService jobApplicationService;
    private final AuthService authService;

    @PostMapping
    @PreAuthorize("hasRole('FARMER')")
    @SecurityRequirement(name = "bearer-jwt")
    @Operation(summary = "Create new job", description = "Post a new agricultural job (FARMER only)")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Job created successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid input"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Only FARMER role can create jobs"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Server error")
    })
    public ApiResponse<JobResponse> createJob(@Valid @RequestBody PostJobRequest request) {
        User user = authService.getCurrentUser();
        return ApiResponse.ok("Job posted", jobService.createJob(request, user.getId()));
    }

    @GetMapping("/nearby")
    @PreAuthorize("hasRole('LABOURER')")
    @SecurityRequirement(name = "bearer-jwt")
    @Operation(summary = "Find nearby jobs", description = "Search for available jobs within 5km radius using geolocation (LABOURER only)")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Nearby jobs retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid coordinates"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Only LABOURER role can search jobs"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Server error")
    })
    public ApiResponse<CursorPageResponse<JobResponse>> getNearby(
            @RequestParam BigDecimal lat,
            @RequestParam BigDecimal lng,
            @RequestParam(required = false, defaultValue = "0") String cursor,
            @RequestParam(required = false, defaultValue = "20") Integer pageSize) {
        User user = authService.getCurrentUser();
        return ApiResponse.ok(jobService.getNearbyJobsPage(lat, lng, user.getId(), cursor, pageSize));
    }

    @GetMapping("/my-posts")
    @PreAuthorize("hasRole('FARMER')")
    @SecurityRequirement(name = "bearer-jwt")
    @Operation(summary = "Get my posted jobs", description = "Retrieve all jobs posted by the current farmer")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Jobs retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Only FARMER role can view own posts"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Server error")
    })
    public ApiResponse<CursorPageResponse<JobResponse>> getMyPosts(
            @RequestParam(required = false, defaultValue = "0") String cursor,
            @RequestParam(required = false, defaultValue = "20") Integer pageSize) {
        User user = authService.getCurrentUser();
        return ApiResponse.ok(jobService.getMyPostsPage(user.getId(), cursor, pageSize));
    }

    @GetMapping("/{id}")
    @SecurityRequirement(name = "bearer-jwt")
    @Operation(summary = "Get job details", description = "Retrieve detailed information about a specific job")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Job details retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Job not found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Server error")
    })
    public ApiResponse<JobResponse> getJob(@PathVariable Long id) {
        User user = authService.getCurrentUser();
        return ApiResponse.ok(jobService.getJobById(id, user.getId()));
    }

    @PostMapping("/{id}/apply")
    @PreAuthorize("hasRole('LABOURER')")
    @SecurityRequirement(name = "bearer-jwt")
    @Operation(summary = "Apply to job", description = "Submit an application to work on a job (LABOURER only)")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Applied successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Cannot apply (already applied, job full, or closed)"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Only LABOURER role can apply"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Job not found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Server error")
    })
    public ApiResponse<JobResponse> apply(@PathVariable Long id) {
        User user = authService.getCurrentUser();
        return ApiResponse.ok("Applied successfully", jobApplicationService.applyToJob(id, user.getId()));
    }

    @PutMapping("/{id}/accept/{labourerId}")
    @PreAuthorize("hasRole('FARMER')")
    @SecurityRequirement(name = "bearer-jwt")
    @Operation(summary = "Accept labourer application", description = "Accept a labourer's application to work on a job (FARMER only)")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Labourer accepted successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Cannot accept (job full or already accepted)"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Only job owner (FARMER) can accept applications"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Job or application not found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Server error")
    })
    public ApiResponse<JobResponse> accept(@PathVariable Long id, @PathVariable Long labourerId) {
        User user = authService.getCurrentUser();
        return ApiResponse.ok("Labourer accepted", jobApplicationService.acceptLabourer(id, labourerId, user.getId()));
    }

    @PutMapping("/{id}/reject/{labourerId}")
    @PreAuthorize("hasRole('FARMER')")
    @SecurityRequirement(name = "bearer-jwt")
    @Operation(summary = "Reject labourer application", description = "Reject a labourer's application (FARMER only)")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Labourer rejected successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Only job owner can reject applications"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Job or application not found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Server error")
    })
    public ApiResponse<JobResponse> reject(@PathVariable Long id, @PathVariable Long labourerId) {
        User user = authService.getCurrentUser();
        return ApiResponse.ok("Labourer rejected", jobApplicationService.rejectLabourer(id, labourerId, user.getId()));
    }

    @PutMapping("/{id}/complete")
    @PreAuthorize("hasRole('FARMER')")
    @SecurityRequirement(name = "bearer-jwt")
    @Operation(summary = "Complete job", description = "Mark a job as completed (FARMER only)")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Job completed successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Only job owner can complete job"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Job not found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Server error")
    })
    public ApiResponse<JobResponse> complete(@PathVariable Long id) {
        User user = authService.getCurrentUser();
        return ApiResponse.ok("Job completed", jobService.completeJob(id, user.getId()));
    }

    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasRole('FARMER')")
    @SecurityRequirement(name = "bearer-jwt")
    @Operation(summary = "Cancel job", description = "Cancel a posted job (FARMER only)")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Job cancelled successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Only job owner can cancel job"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Job not found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Server error")
    })
    public ApiResponse<JobResponse> cancel(@PathVariable Long id) {
        User user = authService.getCurrentUser();
        return ApiResponse.ok("Job cancelled", jobService.cancelJob(id, user.getId()));
    }

    @PutMapping("/{id}/withdraw")
    @PreAuthorize("hasRole('LABOURER')")
    @SecurityRequirement(name = "bearer-jwt")
    @Operation(summary = "Withdraw accepted offer", description = "Withdraw from an accepted job (LABOURER only)")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Offer withdrawn successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Only LABOURER can withdraw"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Job or application not found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Server error")
    })
    public ApiResponse<JobResponse> withdrawAcceptedApplication(@PathVariable Long id) {
        User user = authService.getCurrentUser();
        return ApiResponse.ok("Accepted offer withdrawn", jobApplicationService.cancelAcceptedApplication(id, user.getId()));
    }

    @GetMapping("/{id}/applicants")
    @PreAuthorize("hasRole('FARMER')")
    @SecurityRequirement(name = "bearer-jwt")
    @Operation(summary = "Get job applicants", description = "View all labourers who applied to a job (FARMER only)")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Applicants retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Only job owner can view applicants"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Job not found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Server error")
    })
    public ApiResponse<List<ApplicantResponse>> getApplicants(@PathVariable Long id) {
        User user = authService.getCurrentUser();
        return ApiResponse.ok(jobApplicationService.getApplicants(id, user.getId()));
    }
}
