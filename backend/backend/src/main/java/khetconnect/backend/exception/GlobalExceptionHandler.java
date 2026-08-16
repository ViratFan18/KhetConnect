package khetconnect.backend.exception;

import khetconnect.backend.dto.ErrorResponse;
import khetconnect.backend.exception.AccountLockedException;
import khetconnect.backend.exception.DuplicatePhoneException;
import khetconnect.backend.exception.InvalidCredentialsException;
import khetconnect.backend.exception.ResourceNotFoundException;
import khetconnect.backend.exception.UserNotRegisteredException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(DuplicatePhoneException.class)
    public ResponseEntity<ErrorResponse> handleDuplicatePhone(DuplicatePhoneException ex) {
        return build(HttpStatus.CONFLICT, "DUPLICATE_PHONE", ex.getMessage());
    }

    @ExceptionHandler(UserNotRegisteredException.class)
    public ResponseEntity<ErrorResponse> handleUserNotRegistered(UserNotRegisteredException ex) {
        return build(HttpStatus.NOT_FOUND, "USER_NOT_REGISTERED", ex.getMessage());
    }

    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleInvalidCredentials(InvalidCredentialsException ex) {
        return build(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", ex.getMessage());
    }

    @ExceptionHandler(AccountLockedException.class)
    public ResponseEntity<ErrorResponse> handleAccountLocked(AccountLockedException ex) {
        return build(HttpStatus.FORBIDDEN, "ACCOUNT_LOCKED", ex.getMessage());
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException ex) {
        return build(HttpStatus.NOT_FOUND, "POST_NOT_FOUND", ex.getMessage());
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ErrorResponse> handleBadRequest(BadRequestException ex) {
        return build(HttpStatus.BAD_REQUEST, "INVALID_POST", ex.getMessage());
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex) {
        return build(HttpStatus.FORBIDDEN, "ACCESS_DENIED", "Access denied");
    }

    @ExceptionHandler(JobAlreadyFullException.class)
    public ResponseEntity<ErrorResponse> handleJobAlreadyFull(JobAlreadyFullException ex) {
        return build(HttpStatus.CONFLICT, "JOB_ALREADY_FULL", ex.getMessage());
    }

    @ExceptionHandler(AlreadyAppliedException.class)
    public ResponseEntity<ErrorResponse> handleAlreadyApplied(AlreadyAppliedException ex) {
        return build(HttpStatus.CONFLICT, "ALREADY_APPLIED", ex.getMessage());
    }

    @ExceptionHandler(DuplicateRatingException.class)
    public ResponseEntity<ErrorResponse> handleDuplicateRating(DuplicateRatingException ex) {
        return build(HttpStatus.CONFLICT, "DUPLICATE_RATING", ex.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            errors.put(error.getField(), error.getDefaultMessage());
        }
        ErrorResponse response = ErrorResponse.builder()
                .status(HttpStatus.BAD_REQUEST.value())
                .error("VALIDATION_FAILED")
                .message("Validation failed")
                .details(errors)
                .timestamp(LocalDateTime.now())
                .build();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneral(Exception ex) {
        log.error("Unhandled server error", ex);
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "SERVER_ERROR", "Something went wrong on our end. Please try again in a moment.");
    }

    private ResponseEntity<ErrorResponse> build(HttpStatus status, String code, String message) {
        ErrorResponse response = ErrorResponse.builder()
                .error(code)
                .message(message)
                .status(status.value())
                .timestamp(LocalDateTime.now())
                .build();
        return ResponseEntity.status(status).body(response);
    }
}
