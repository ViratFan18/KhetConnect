package khetconnect.backend.repository;

import khetconnect.backend.entity.Rating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RatingRepository extends JpaRepository<Rating, Long> {
    List<Rating> findByRateeIdOrderByCreatedAtDesc(Long rateeId);
    List<Rating> findByRaterIdOrderByCreatedAtDesc(Long raterId);
    Optional<Rating> findByRaterIdAndJobId(Long raterId, Long jobId);
    boolean existsByRaterIdAndJobId(Long raterId, Long jobId);

    @Query("SELECT AVG(r.stars) FROM Rating r WHERE r.ratee.id = :rateeId")
    Double averageStarsByRateeId(@Param("rateeId") Long rateeId);

    @Query("SELECT COUNT(r) FROM Rating r WHERE r.ratee.id = :rateeId")
    long countByRateeId(@Param("rateeId") Long rateeId);
}
