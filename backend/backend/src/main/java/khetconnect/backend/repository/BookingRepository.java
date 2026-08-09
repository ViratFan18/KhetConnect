package khetconnect.backend.repository;

import khetconnect.backend.entity.Booking;
import khetconnect.backend.entity.Booking.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByFarmerIdOrderByCreatedAtDesc(Long farmerId);
    List<Booking> findByAvailabilityLabourerIdOrderByCreatedAtDesc(Long labourerId);
    List<Booking> findByAvailabilityIdAndStatusIn(Long availabilityId, List<BookingStatus> statuses);
    List<Booking> findByAvailabilityIdOrderByCreatedAtDesc(Long availabilityId);
}
