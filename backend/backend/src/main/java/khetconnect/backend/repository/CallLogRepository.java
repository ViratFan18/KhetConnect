package khetconnect.backend.repository;

import khetconnect.backend.entity.CallLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CallLogRepository extends JpaRepository<CallLog, Long> {
}
