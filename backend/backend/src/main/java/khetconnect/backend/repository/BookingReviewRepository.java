package khetconnect.backend.repository;

import khetconnect.backend.entity.Booking;
import khetconnect.backend.entity.BookingReview;
import khetconnect.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BookingReviewRepository extends JpaRepository<BookingReview, Long> {
    Optional<BookingReview> findByBookingAndReviewer(Booking booking, User reviewer);
    Optional<BookingReview> findByBookingIdAndReviewerId(Long bookingId, Long reviewerId);
}
