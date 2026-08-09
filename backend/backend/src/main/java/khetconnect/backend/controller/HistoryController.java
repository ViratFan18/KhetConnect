package khetconnect.backend.controller;

import khetconnect.backend.dto.ApiResponse;
import khetconnect.backend.dto.JobResponse;
import khetconnect.backend.entity.User;
import khetconnect.backend.service.AuthService;
import khetconnect.backend.service.JobService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/history")
@RequiredArgsConstructor
public class HistoryController {

    private final JobService jobService;
    private final AuthService authService;

    @GetMapping("/farmer")
    @PreAuthorize("hasRole('FARMER')")
    public ApiResponse<List<JobResponse>> farmerHistory() {
        User user = authService.getCurrentUser();
        return ApiResponse.ok(jobService.getFarmerHistory(user.getId()));
    }

    @GetMapping("/labourer")
    @PreAuthorize("hasRole('LABOURER')")
    public ApiResponse<List<JobResponse>> labourerHistory() {
        User user = authService.getCurrentUser();
        return ApiResponse.ok(jobService.getLabourerHistory(user.getId()));
    }
}
