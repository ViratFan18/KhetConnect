package khetconnect.backend.exception;

/**
 * Thrown when a labourer attempts to apply to a job that already has sufficient workers,
 * or when attempting to accept an application for a job that is already full.
 * This is a concurrency-related error that should be handled specially on the frontend.
 */
public class JobAlreadyFullException extends RuntimeException {
    public JobAlreadyFullException(String message) {
        super(message);
    }
}
