package khetconnect.backend.service;

import khetconnect.backend.dto.CallLogRequest;
import khetconnect.backend.dto.ContactInfoResponse;
import khetconnect.backend.entity.*;
import khetconnect.backend.exception.BadRequestException;
import khetconnect.backend.exception.ResourceNotFoundException;
import khetconnect.backend.repository.CallLogRepository;
import khetconnect.backend.repository.JobApplicationRepository;
import khetconnect.backend.repository.JobRepository;
import khetconnect.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ContactService {

    private final UserRepository userRepository;
    private final JobRepository jobRepository;
    private final JobApplicationRepository jobApplicationRepository;
    private final CallLogRepository callLogRepository;

    public ContactInfoResponse getContactInfo(Long currentUserId, Long otherUserId) {
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Current user not found"));
        User otherUser = userRepository.findById(otherUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (currentUserId.equals(otherUserId)) {
            return ContactInfoResponse.builder()
                    .id(otherUser.getId())
                    .name(otherUser.getName())
                    .phone(otherUser.getPhone())
                    .canCall(true)
                    .build();
        }

        boolean canCall = canViewContact(currentUser, otherUser);
        return ContactInfoResponse.builder()
                .id(otherUser.getId())
                .name(otherUser.getName())
                .phone(canCall ? otherUser.getPhone() : null)
                .canCall(canCall)
                .build();
    }

    @Transactional
    public void logCall(Long callerId, CallLogRequest request) {
        User caller = userRepository.findById(callerId)
                .orElseThrow(() -> new ResourceNotFoundException("Caller not found"));
        User receiver = userRepository.findById(request.getReceiverId())
                .orElseThrow(() -> new ResourceNotFoundException("Receiver not found"));

        if (callerId.equals(request.getReceiverId())) {
            throw new BadRequestException("You cannot log a call with yourself");
        }

        boolean canCall = canViewContact(caller, receiver);
        if (!canCall) {
            throw new BadRequestException("You are not allowed to contact this user");
        }

        Job job = null;
        if (request.getJobId() != null) {
            job = jobRepository.findById(request.getJobId())
                    .orElseThrow(() -> new ResourceNotFoundException("Job not found"));

            if (!isParticipantInAcceptedJob(callerId, request.getReceiverId(), job.getId())) {
                throw new BadRequestException("Call must be made between accepted job participants");
            }
        }

        CallLog callLog = CallLog.builder()
                .caller(caller)
                .receiver(receiver)
                .job(job)
                .status(CallStatus.REQUESTED)
                .durationSeconds(request.getDurationSeconds())
                .build();

        callLogRepository.save(callLog);
    }

    private boolean canViewContact(User currentUser, User otherUser) {
        if (currentUser.getId().equals(otherUser.getId())) {
            return true;
        }

        if (currentUser.getRole() == UserRole.FARMER && otherUser.getRole() == UserRole.LABOURER) {
            return jobRepository.findByFarmerIdOrderByCreatedAtDesc(currentUser.getId()).stream()
                    .filter(job -> job.getStatus() == JobStatus.IN_PROGRESS || job.getStatus() == JobStatus.COMPLETED)
                    .anyMatch(job -> jobApplicationRepository.findByJobIdAndLabourerId(job.getId(), otherUser.getId())
                            .map(application -> application.getStatus() == ApplicationStatus.ACCEPTED)
                            .orElse(false));
        }

        if (currentUser.getRole() == UserRole.LABOURER && otherUser.getRole() == UserRole.FARMER) {
            return jobApplicationRepository.findByLabourerIdOrderByAppliedAtDesc(currentUser.getId()).stream()
                    .filter(application -> application.getStatus() == ApplicationStatus.ACCEPTED)
                    .map(JobApplication::getJob)
                    .filter(job -> job.getFarmer().getId().equals(otherUser.getId()))
                    .anyMatch(job -> job.getStatus() == JobStatus.IN_PROGRESS || job.getStatus() == JobStatus.COMPLETED);
        }

        return false;
    }

    private boolean isParticipantInAcceptedJob(Long callerId, Long receiverId, Long jobId) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job not found"));

        boolean callerAccepted = jobApplicationRepository.findByJobIdAndLabourerId(jobId, callerId)
                .map(application -> application.getStatus() == ApplicationStatus.ACCEPTED)
                .orElse(false);

        boolean receiverAccepted = jobApplicationRepository.findByJobIdAndLabourerId(jobId, receiverId)
                .map(application -> application.getStatus() == ApplicationStatus.ACCEPTED)
                .orElse(false);

        boolean farmerIsParticipant = job.getFarmer().getId().equals(callerId) || job.getFarmer().getId().equals(receiverId);
        return (callerAccepted && receiverAccepted) || (farmerIsParticipant && (callerAccepted || receiverAccepted));
    }
}
