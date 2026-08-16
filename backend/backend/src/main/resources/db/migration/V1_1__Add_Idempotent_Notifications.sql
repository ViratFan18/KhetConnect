-- KhetConnect Database Migration
-- Date: 2026-08-14
-- Purpose: Add idempotency & retry logic to notifications
-- 
-- Changes:
-- 1. Add job_id column to notifications table (FK to jobs)
-- 2. Add unique constraint on (user_id, job_id, type) for idempotency
-- 3. Update schema to support duplicate detection

-- For PostgreSQL (Production - Neon)
-- Run this migration:

-- Step 1: Add job_id column to notifications table
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS job_id BIGINT,
ADD CONSTRAINT fk_notifications_job 
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE;

-- Step 2: Create unique constraint for idempotency
-- This constraint ensures no duplicate notifications for (user_id, job_id, type)
-- Note: For notifications without a jobId, NULL != NULL in SQL, so multiple notifications without jobId are allowed
ALTER TABLE notifications
ADD CONSTRAINT uk_notifications_user_job_type 
    UNIQUE (user_id, job_id, type);

-- Step 3: Create index for faster queries on user notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_read 
    ON notifications(user_id, read) 
    INCLUDE (created_at);

-- Step 4: Create index for user + job + type lookups (for idempotency checks)
CREATE INDEX IF NOT EXISTS idx_notifications_user_job_type 
    ON notifications(user_id, job_id, type) 
    WHERE job_id IS NOT NULL;

-- Rollback statements (if needed):
-- ALTER TABLE notifications DROP CONSTRAINT uk_notifications_user_job_type;
-- ALTER TABLE notifications DROP CONSTRAINT fk_notifications_job;
-- ALTER TABLE notifications DROP COLUMN IF EXISTS job_id;
-- DROP INDEX IF EXISTS idx_notifications_user_read;
-- DROP INDEX IF EXISTS idx_notifications_user_job_type;

-- For H2 Database (Development - In-Memory)
-- H2 auto-applies changes via JPA, so this migration is mainly for reference
-- When you run the app with H2, it will:
-- 1. Recreate tables from entity definitions
-- 2. Apply unique constraints from @UniqueConstraint annotations
-- 3. Apply foreign keys from @JoinColumn annotations

-- The Notification.java entity now has:
-- @Table(name = "notifications", uniqueConstraints = {
--         @UniqueConstraint(columnNames = {"user_id", "job_id", "type"}, 
--                 name = "uk_notifications_user_job_type")
-- })
-- @ManyToOne(fetch = FetchType.LAZY)
-- @JoinColumn(name = "job_id")
-- private Job job;

-- Migration Notes:
-- - For existing applications with old schema: add job_id column first, then add unique constraint
-- - The unique constraint allows NULL values for job_id (SQL standard: NULL != NULL)
-- - This means notifications without a job can be duplicated (e.g., multiple JOB_POSTED for same user)
-- - But notifications with a job are de-duplicated: only one (user, job, type) combo allowed
-- 
-- Behavior:
-- - JOB_POSTED: user_id + NULL + type = multiple allowed (different jobs)
-- - APPLICATION: user_id + job_id + type = only one allowed (de-duplicated)
-- - APPLICATION_ACCEPTED: user_id + job_id + type = only one allowed (de-duplicated)
-- - APPLICATION_REJECTED: user_id + job_id + type = only one allowed (de-duplicated)
-- - JOB_COMPLETED: user_id + job_id + type = only one allowed (de-duplicated)
-- - JOB_CANCELLED: user_id + job_id + type = only one allowed (de-duplicated)

-- Verification Query (After migration):
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'notifications' 
-- ORDER BY ordinal_position;
--
-- Should show: job_id BIGINT column added

-- Test: Try to insert duplicate notification
-- INSERT INTO notifications (user_id, job_id, type, title, body, read, created_at) 
-- VALUES (1, 100, 'APPLICATION_REJECTED', 'Rejected', 'You were rejected', false, NOW());
-- INSERT INTO notifications (user_id, job_id, type, title, body, read, created_at) 
-- VALUES (1, 100, 'APPLICATION_REJECTED', 'Rejected', 'You were rejected', false, NOW());
-- -- Should fail with constraint violation on second insert
