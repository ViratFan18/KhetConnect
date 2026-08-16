package khetconnect.backend.repository;

import khetconnect.backend.entity.Rating;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RatingRepository extends JpaRepository<Rating, Long> {
    @Query("SELECT r FROM Rating r JOIN FETCH r.rater rr JOIN FETCH r.job j WHERE r.ratee.id = :rateeId ORDER BY r.createdAt DESC")
    List<Rating> findByRateeIdOrderByCreatedAtDesc(@Param("rateeId") Long rateeId);

    @Query("SELECT r FROM Rating r JOIN FETCH r.rater rr JOIN FETCH r.job j WHERE r.rater.id = :raterId ORDER BY r.createdAt DESC")
    List<Rating> findByRaterIdOrderByCreatedAtDesc(@Param("raterId") Long raterId);

    Optional<Rating> findByRaterIdAndJobId(Long raterId, Long jobId);
    boolean existsByRaterIdAndJobId(Long raterId, Long jobId);

    /**
     * Check if a rating exists with a pessimistic lock to prevent race conditions.
     * Use this before creating a new rating to ensure atomicity.
     */
    @Lock(LockModeType.PESSIMISTIC_READ)
    @Query("SELECT r FROM Rating r WHERE r.rater.id = :raterId AND r.job.id = :jobId")
    Optional<Rating> findByRaterIdAndJobIdWithLock(@Param("raterId") Long raterId, @Param("jobId") Long jobId);

    @Query("SELECT AVG(r.stars) FROM Rating r WHERE r.ratee.id = :rateeId")
    Double averageStarsByRateeId(@Param("rateeId") Long rateeId);

    @Query("SELECT COUNT(r) FROM Rating r WHERE r.ratee.id = :rateeId")
    long countByRateeId(@Param("rateeId") Long rateeId);
}
