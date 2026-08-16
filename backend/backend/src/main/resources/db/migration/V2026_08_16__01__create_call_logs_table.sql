CREATE TABLE IF NOT EXISTS call_logs (
    id BIGSERIAL PRIMARY KEY,
    caller_user_id BIGINT NOT NULL,
    receiver_user_id BIGINT NOT NULL,
    job_id BIGINT,
    status VARCHAR(20) NOT NULL DEFAULT 'REQUESTED',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    duration_seconds INTEGER,
    CONSTRAINT fk_call_logs_caller FOREIGN KEY (caller_user_id) REFERENCES users(id),
    CONSTRAINT fk_call_logs_receiver FOREIGN KEY (receiver_user_id) REFERENCES users(id),
    CONSTRAINT fk_call_logs_job FOREIGN KEY (job_id) REFERENCES jobs(id)
);

CREATE INDEX IF NOT EXISTS idx_call_logs_caller_user
    ON call_logs (caller_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_call_logs_receiver_user
    ON call_logs (receiver_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_call_logs_job
    ON call_logs (job_id, created_at DESC);
