package khetconnect.backend.repository;

import khetconnect.backend.entity.Job;
import khetconnect.backend.entity.JobStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface JobRepository extends JpaRepository<Job, Long> {
    @Override
    @EntityGraph(attributePaths = "farmer")
    Optional<Job> findById(Long id);

    @EntityGraph(attributePaths = "farmer")
    List<Job> findByFarmerIdOrderByCreatedAtDesc(Long farmerId);

    @EntityGraph(attributePaths = "farmer")
    List<Job> findByStatusOrderByCreatedAtDesc(JobStatus status);

    /**
     * Fetch Job by ID with pessimistic write lock.
     * Use this when performing operations that may conflict with concurrent requests (apply, accept).
     * The lock will be held until the transaction completes.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @EntityGraph(attributePaths = "farmer")
    @Query("SELECT j FROM Job j WHERE j.id = :id")
    Optional<Job> findByIdWithLock(@Param("id") Long id);

    @Query(value = """
        SELECT
            j.id AS id,
            j.title AS title,
            j.description AS description,
            j.work_type AS workType,
            j.crop_type AS cropType,
            j.wage_per_day AS wagePerDay,
            j.workers_needed AS workersNeeded,
            j.work_date AS workDate,
            j.latitude AS latitude,
            j.longitude AS longitude,
            j.village AS village,
            j.status AS status,
            j.created_at AS createdAt,
            j.updated_at AS updatedAt,
            u.id AS farmerId,
            u.name AS farmerName,
            u.phone AS farmerPhone,
            u.rating_avg AS farmerRating,
            u.rating_count AS farmerRatingCount,
            ST_Distance(j.location, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography) / 1000.0 AS distanceKm
        FROM jobs j
        JOIN users u ON u.id = j.farmer_id
        WHERE j.status = :status
          AND j.latitude IS NOT NULL
          AND j.longitude IS NOT NULL
          AND ST_DWithin(j.location, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, :radiusMeters)
        ORDER BY ST_Distance(j.location, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography)
        """, nativeQuery = true)
    List<NearbyJobRow> findNearbyJobsWithDistance(
            @Param("lat") BigDecimal lat,
            @Param("lng") BigDecimal lng,
            @Param("radiusMeters") double radiusMeters,
            @Param("status") String status);

    interface NearbyJobRow {
        Long getId();
        String getTitle();
        String getDescription();
        String getWorkType();
        String getCropType();
        Integer getWagePerDay();
        Integer getWorkersNeeded();
        LocalDate getWorkDate();
        BigDecimal getLatitude();
        BigDecimal getLongitude();
        String getVillage();
        String getStatus();
        LocalDateTime getCreatedAt();
        LocalDateTime getUpdatedAt();
        Long getFarmerId();
        String getFarmerName();
        String getFarmerPhone();
        BigDecimal getFarmerRating();
        Integer getFarmerRatingCount();
        Double getDistanceKm();
    }
}
