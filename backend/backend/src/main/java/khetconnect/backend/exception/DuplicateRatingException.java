package khetconnect.backend.exception;

/**
 * Thrown when attempting to create a rating that already exists.
 * Prevents duplicate ratings in concurrent scenarios.
 */
public class DuplicateRatingException extends RuntimeException {
    public DuplicateRatingException(String message) {
        super(message);
    }
}
