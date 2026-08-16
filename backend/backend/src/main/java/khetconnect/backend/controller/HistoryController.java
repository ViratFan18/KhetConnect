package khetconnect.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
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
@Tag(name = "History", description = "User work history and job history endpoints")
public class HistoryController {

    private final JobService jobService;
    private final AuthService authService;

    @GetMapping("/farmer")
    @PreAuthorize("hasRole('FARMER')")
    @SecurityRequirement(name = "bearer-jwt")
    @Operation(summary = "Get farmer job history", description = "Retrieve all jobs posted by the current farmer (FARMER only)")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Farmer history retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Only FARMER role can access this"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Server error")
    })
    public ApiResponse<List<JobResponse>> farmerHistory() {
        User user = authService.getCurrentUser();
        return ApiResponse.ok(jobService.getFarmerHistory(user.getId()));
    }

    @GetMapping("/labourer")
    @PreAuthorize("hasRole('LABOURER')")
    @SecurityRequirement(name = "bearer-jwt")
    @Operation(summary = "Get labourer work history", description = "Retrieve all jobs worked on by the current labourer (LABOURER only)")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Labourer history retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Only LABOURER role can access this"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Server error")
    })
    public ApiResponse<List<JobResponse>> labourerHistory() {
        User user = authService.getCurrentUser();
        return ApiResponse.ok(jobService.getLabourerHistory(user.getId()));
    }
}
