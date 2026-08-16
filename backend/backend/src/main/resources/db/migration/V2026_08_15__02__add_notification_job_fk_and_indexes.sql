-- Additive schema migration for notification-job linking and index coverage.
-- This file is intentionally non-destructive and safe for PostgreSQL 14+.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'notifications'
          AND column_name = 'job_id'
    ) THEN
        ALTER TABLE notifications ADD COLUMN job_id BIGINT;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints tc
        WHERE tc.table_schema = 'public'
          AND tc.table_name = 'notifications'
          AND tc.constraint_name = 'fk_notifications_job'
    ) THEN
        ALTER TABLE notifications
            ADD CONSTRAINT fk_notifications_job
            FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_notifications_job_id
    ON notifications (job_id);

CREATE INDEX IF NOT EXISTS idx_jobs_status_work_date
    ON jobs (status, work_date);

CREATE INDEX IF NOT EXISTS idx_job_applications_labourer_status
    ON job_applications (labourer_id, status);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'uk_notifications_user_job_type'
    ) THEN
        ALTER TABLE notifications
            ADD CONSTRAINT uk_notifications_user_job_type
            UNIQUE (user_id, job_id, type);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_notifications_user_created_at
    ON notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_job_applications_labourer_applied_at
    ON job_applications (labourer_id, applied_at DESC);
