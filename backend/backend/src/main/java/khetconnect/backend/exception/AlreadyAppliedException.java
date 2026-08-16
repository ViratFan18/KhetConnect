package khetconnect.backend.exception;

/**
 * Thrown when a labourer attempts to apply to a job they have already applied to.
 * This prevents duplicate applications in concurrent scenarios.
 */
public class AlreadyAppliedException extends RuntimeException {
    public AlreadyAppliedException(String message) {
        super(message);
    }
}
