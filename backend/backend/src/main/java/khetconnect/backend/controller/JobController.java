package khetconnect.backend.controller;

import jakarta.validation.Valid;
import khetconnect.backend.dto.*;
import khetconnect.backend.entity.User;
import khetconnect.backend.service.AuthService;
import khetconnect.backend.service.JobService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/jobs")
@RequiredArgsConstructor
public class JobController {

    private final JobService jobService;
    private final AuthService authService;

    @PostMapping
    @PreAuthorize("hasRole('FARMER')")
    public ApiResponse<JobResponse> createJob(@Valid @RequestBody PostJobRequest request) {
        User user = authService.getCurrentUser();
        return ApiResponse.ok("Job posted", jobService.createJob(request, user.getId()));
    }

    @GetMapping("/nearby")
    @PreAuthorize("hasRole('LABOURER')")
    public ApiResponse<List<JobResponse>> getNearby(
            @RequestParam BigDecimal lat,
            @RequestParam BigDecimal lng) {
        User user = authService.getCurrentUser();
        return ApiResponse.ok(jobService.getNearbyJobs(lat, lng, user.getId()));
    }

    @GetMapping("/my-posts")
    @PreAuthorize("hasRole('FARMER')")
    public ApiResponse<List<JobResponse>> getMyPosts() {
        User user = authService.getCurrentUser();
        return ApiResponse.ok(jobService.getMyPosts(user.getId()));
    }

    @GetMapping("/{id}")
    public ApiResponse<JobResponse> getJob(@PathVariable Long id) {
        User user = authService.getCurrentUser();
        return ApiResponse.ok(jobService.getJobById(id, user.getId()));
    }

    @PostMapping("/{id}/apply")
    @PreAuthorize("hasRole('LABOURER')")
    public ApiResponse<JobResponse> apply(@PathVariable Long id) {
        User user = authService.getCurrentUser();
        return ApiResponse.ok("Applied successfully", jobService.applyToJob(id, user.getId()));
    }

    @PutMapping("/{id}/accept/{labourerId}")
    @PreAuthorize("hasRole('FARMER')")
    public ApiResponse<JobResponse> accept(@PathVariable Long id, @PathVariable Long labourerId) {
        User user = authService.getCurrentUser();
        return ApiResponse.ok("Labourer accepted", jobService.acceptLabourer(id, labourerId, user.getId()));
    }

    @PutMapping("/{id}/reject/{labourerId}")
    @PreAuthorize("hasRole('FARMER')")
    public ApiResponse<JobResponse> reject(@PathVariable Long id, @PathVariable Long labourerId) {
        User user = authService.getCurrentUser();
        return ApiResponse.ok("Labourer rejected", jobService.rejectLabourer(id, labourerId, user.getId()));
    }

    @PutMapping("/{id}/complete")
    @PreAuthorize("hasRole('FARMER')")
    public ApiResponse<JobResponse> complete(@PathVariable Long id) {
        User user = authService.getCurrentUser();
        return ApiResponse.ok("Job completed", jobService.completeJob(id, user.getId()));
    }

    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasRole('FARMER')")
    public ApiResponse<JobResponse> cancel(@PathVariable Long id) {
        User user = authService.getCurrentUser();
        return ApiResponse.ok("Job cancelled", jobService.cancelJob(id, user.getId()));
    }

    @GetMapping("/{id}/applicants")
    @PreAuthorize("hasRole('FARMER')")
    public ApiResponse<List<ApplicantResponse>> getApplicants(@PathVariable Long id) {
        User user = authService.getCurrentUser();
        return ApiResponse.ok(jobService.getApplicants(id, user.getId()));
    }
}
