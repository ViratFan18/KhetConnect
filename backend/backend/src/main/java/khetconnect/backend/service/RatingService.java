package khetconnect.backend.service;

import khetconnect.backend.dto.RatingRequest;
import khetconnect.backend.dto.RatingResponse;
import khetconnect.backend.entity.*;
import khetconnect.backend.exception.BadRequestException;
import khetconnect.backend.exception.ResourceNotFoundException;
import khetconnect.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RatingService {

    private final RatingRepository ratingRepository;
    private final JobRepository jobRepository;
    private final JobApplicationRepository applicationRepository;
    private final UserRepository userRepository;

    @Transactional
    public RatingResponse submitRating(Long raterId, RatingRequest request) {
        if (ratingRepository.existsByRaterIdAndJobId(raterId, request.getJobId())) {
            throw new BadRequestException("You have already rated this job");
        }

        Job job = jobRepository.findById(request.getJobId())
                .orElseThrow(() -> new ResourceNotFoundException("Job not found"));
        if (job.getStatus() != JobStatus.COMPLETED) {
            throw new BadRequestException("Job must be completed before rating");
        }

        User rater = userRepository.findById(raterId).orElseThrow();
        User ratee = userRepository.findById(request.getRateeId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        boolean isFarmer = job.getFarmer().getId().equals(raterId);
        boolean isAcceptedLabourer = applicationRepository
                .findByJobIdAndLabourerId(job.getId(), raterId)
                .map(a -> a.getStatus() == ApplicationStatus.ACCEPTED)
                .orElse(false);

        if (!isFarmer && !isAcceptedLabourer) {
            throw new BadRequestException("You are not part of this job");
        }

        if (isFarmer && !applicationRepository.findByJobIdAndLabourerId(job.getId(), ratee.getId()).isPresent()) {
            throw new BadRequestException("Can only rate accepted labourers");
        }
        if (!isFarmer && !job.getFarmer().getId().equals(ratee.getId())) {
            throw new BadRequestException("Labourer can only rate the farmer");
        }

        Rating rating = Rating.builder()
                .rater(rater)
                .ratee(ratee)
                .job(job)
                .stars(request.getStars())
                .comment(request.getComment())
                .build();
        rating = ratingRepository.save(rating);
        recalculateRating(ratee.getId());

        return RatingResponse.builder()
                .id(rating.getId())
                .jobId(rating.getJob().getId())
                .stars(rating.getStars())
                .comment(rating.getComment())
                .raterName(rater.getName())
                .createdAt(rating.getCreatedAt())
                .build();
    }

    public List<RatingResponse> getRatingsForUser(Long userId) {
        return ratingRepository.findByRateeIdOrderByCreatedAtDesc(userId).stream()
                .map(r -> RatingResponse.builder()
                        .id(r.getId())
                        .jobId(r.getJob().getId())
                        .stars(r.getStars())
                        .comment(r.getComment())
                        .raterName(r.getRater().getName())
                        .createdAt(r.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    public List<RatingResponse> getRatingsGivenByUser(Long raterId) {
        return ratingRepository.findByRaterIdOrderByCreatedAtDesc(raterId).stream()
                .map(r -> RatingResponse.builder()
                        .id(r.getId())
                        .jobId(r.getJob().getId())
                        .stars(r.getStars())
                        .comment(r.getComment())
                        .raterName(r.getRater().getName())
                        .createdAt(r.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    private void recalculateRating(Long rateeId) {
        Double avg = ratingRepository.averageStarsByRateeId(rateeId);
        long count = ratingRepository.countByRateeId(rateeId);
        User user = userRepository.findById(rateeId).orElseThrow();
        user.setRatingAvg(avg != null
                ? BigDecimal.valueOf(avg).setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO);
        user.setRatingCount((int) count);
        userRepository.save(user);
    }
}
