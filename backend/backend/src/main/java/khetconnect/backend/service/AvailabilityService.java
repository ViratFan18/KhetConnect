package khetconnect.backend.service;

import khetconnect.backend.dto.AvailabilityResponse;
import khetconnect.backend.dto.BookingResponse;
import khetconnect.backend.dto.BookingReviewResponse;
import khetconnect.backend.dto.PostBookingRequest;
import khetconnect.backend.dto.ReviewRequest;
import khetconnect.backend.entity.*;
import khetconnect.backend.exception.BadRequestException;
import khetconnect.backend.exception.ResourceNotFoundException;
import khetconnect.backend.repository.*;
import khetconnect.backend.util.GeoUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AvailabilityService {

    private static final double NEARBY_RADIUS_KM = 5.0;

    private final AvailabilityRepository availabilityRepository;
    private final BookingRepository bookingRepository;
    private final BookingReviewRepository bookingReviewRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public List<AvailabilityResponse> getNearbyAvailabilities(BigDecimal lat, BigDecimal lng) {
        return availabilityRepository.findAll().stream()
                .filter(a -> a.getLatitude() != null && a.getLongitude() != null)
                .filter(a -> GeoUtil.withinKm(lat, lng, a.getLatitude(), a.getLongitude(), NEARBY_RADIUS_KM))
                .sorted(Comparator.comparingDouble(a -> GeoUtil.distanceKm(lat, lng, a.getLatitude(), a.getLongitude())))
                .map(a -> {
                    AvailabilityResponse r = toResponse(a, null);
                    r.setDistanceKm(GeoUtil.distanceKm(lat, lng, a.getLatitude(), a.getLongitude()));
                    return r;
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public BookingResponse bookAvailability(Long availabilityId, PostBookingRequest req, Long farmerId) {
        Availability a = availabilityRepository.findById(availabilityId).orElseThrow(() -> new ResourceNotFoundException("Availability not found"));
        if (a.getStatus() != Availability.AvailabilityStatus.OPEN) {
            throw new BadRequestException("Availability is no longer open");
        }
        if (req.getWorkersBooked() == null || req.getWorkersBooked() <= 0) {
            throw new BadRequestException("Invalid workers booked");
        }
        User farmer = userRepository.findById(farmerId).orElseThrow(() -> new ResourceNotFoundException("Farmer not found"));

        Booking b = Booking.builder()
                .availability(a)
                .farmer(farmer)
                .workersBooked(req.getWorkersBooked())
                .amount(req.getAmount())
                .status(Booking.BookingStatus.REQUESTED)
                .build();
        b = bookingRepository.save(b);

        notificationService.notifyUser(a.getLabourer(), "Booking Request", farmer.getName() + " requested " + req.getWorkersBooked() + " worker(s)", "BOOKING_REQUEST");
        return toBookingResponse(b);
    }

    @Transactional
    public BookingResponse completeBooking(Long bookingId, Long labourerId) {
        Booking b = bookingRepository.findById(bookingId).orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
        if (!b.getAvailability().getLabourer().getId().equals(labourerId) && !b.getFarmer().getId().equals(labourerId)) {
            throw new BadRequestException("Not authorized to complete");
        }
        if (b.getStatus() == Booking.BookingStatus.COMPLETED || b.getStatus() == Booking.BookingStatus.CANCELLED) {
            throw new BadRequestException("Booking already closed");
        }
        b.setStatus(Booking.BookingStatus.COMPLETED);
        b.setUpdatedAt(LocalDateTime.now());
        b.setCompletedAt(LocalDateTime.now());
        b.getAvailability().setStatus(Availability.AvailabilityStatus.COMPLETED);
        bookingRepository.save(b);
        availabilityRepository.save(b.getAvailability());

        notificationService.notifyUser(b.getFarmer(), "Work Completed", "The booking is complete. Please leave a review.", "BOOKING_COMPLETED");
        return toBookingResponse(b);
    }

    @Transactional
    public BookingResponse cancelBooking(Long bookingId, Long userId) {
        Booking b = bookingRepository.findById(bookingId).orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
        if (!b.getAvailability().getLabourer().getId().equals(userId) && !b.getFarmer().getId().equals(userId)) {
            throw new BadRequestException("Not authorized to cancel");
        }
        b.setStatus(Booking.BookingStatus.CANCELLED);
        b.setUpdatedAt(LocalDateTime.now());
        b.getAvailability().setStatus(Availability.AvailabilityStatus.CANCELLED);
        bookingRepository.save(b);
        availabilityRepository.save(b.getAvailability());

        notificationService.notifyUser(b.getFarmer(), "Booking Cancelled", "The booking was cancelled", "BOOKING_CANCELLED");
        notificationService.notifyUser(b.getAvailability().getLabourer(), "Booking Cancelled", "The booking was cancelled", "BOOKING_CANCELLED");
        return toBookingResponse(b);
    }

    public List<BookingResponse> getFarmerBookings(Long farmerId) {
        return bookingRepository.findByFarmerIdOrderByCreatedAtDesc(farmerId).stream()
                .map(this::toBookingResponse)
                .collect(Collectors.toList());
    }

    public List<BookingResponse> getLabourerBookings(Long labourerId) {
        return bookingRepository.findByAvailabilityLabourerIdOrderByCreatedAtDesc(labourerId).stream()
                .map(this::toBookingResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public BookingReviewResponse submitBookingReview(Long bookingId, Long reviewerId, ReviewRequest request) {
        Booking booking = bookingRepository.findById(bookingId).orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
        User reviewer = userRepository.findById(reviewerId).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        User reviewee = booking.getFarmer().getId().equals(reviewerId) ? booking.getAvailability().getLabourer() : booking.getFarmer();

        if (bookingReviewRepository.findByBookingAndReviewer(booking, reviewer).isPresent()) {
            throw new BadRequestException("You have already reviewed this booking");
        }

        BookingReview review = BookingReview.builder()
                .booking(booking)
                .reviewer(reviewer)
                .reviewee(reviewee)
                .rating(request.getRating())
                .comment(request.getComment())
                .build();
        review = bookingReviewRepository.save(review);

        return BookingReviewResponse.builder()
                .id(review.getId())
                .bookingId(booking.getId())
                .reviewerId(reviewer.getId())
                .revieweeId(reviewee.getId())
                .rating(review.getRating())
                .comment(review.getComment())
                .build();
    }

    private AvailabilityResponse toResponse(Availability a, BigDecimal viewerLng) {

        return AvailabilityResponse.builder()
                .id(a.getId())
                .labourerId(a.getLabourer().getId())
                .labourerName(a.getLabourer().getName())
                .skills(a.getSkills())
                .workersAvailable(a.getWorkersAvailable())
                .wagePerDay(a.getWagePerDay())
                .availableFrom(a.getAvailableFrom())
                .availableTo(a.getAvailableTo())
                .latitude(a.getLatitude())
                .longitude(a.getLongitude())
                .village(a.getVillage())
                .workType(a.getWorkType())
                .status(a.getStatus())
                .createdAt(a.getCreatedAt())
                .build();
    }

    private BookingResponse toBookingResponse(Booking booking) {
        return BookingResponse.builder()
                .id(booking.getId())
                .availability(toResponse(booking.getAvailability(), null))
                .farmerId(booking.getFarmer().getId())
                .farmerName(booking.getFarmer().getName())
                .workersBooked(booking.getWorkersBooked())
                .amount(booking.getAmount())
                .status(booking.getStatus())
                .reviewedByFarmer(hasReviewFrom(booking.getId(), booking.getFarmer().getId()))
                .reviewedByLabourer(hasReviewFrom(booking.getId(), booking.getAvailability().getLabourer().getId()))
                .createdAt(booking.getCreatedAt())
                .updatedAt(booking.getUpdatedAt())
                .respondedAt(booking.getRespondedAt())
                .completedAt(booking.getCompletedAt())
                .build();
    }

    private boolean hasReviewFrom(Long bookingId, Long reviewerId) {
        return bookingReviewRepository.findByBookingIdAndReviewerId(bookingId, reviewerId).isPresent();
    }
}
