package com.ecommerce.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;
import java.util.Map;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiResponse<T>(
        boolean success,
        T data,
        String message,
        String errorCode,
        Map<String, String> errors,
        Long timestamp
) {

    // Success with data
    public static <T> ApiResponse<T> ok(T data, String message) {
        return new ApiResponse<>(true, data, message, null, null, Instant.now().toEpochMilli());
    }

    // Success without data (e.g., delete, resend-otp)
    public static <T> ApiResponse<T> ok(String message) {
        return new ApiResponse<>(true, null, message, null, null, Instant.now().toEpochMilli());
    }

    // Error
    public static <T> ApiResponse<T> error(String message, String errorCode) {
        return new ApiResponse<>(false, null, message, errorCode, null, Instant.now().toEpochMilli());
    }

    // Optional: for validation errors with field details (advanced)
    public static <T> ApiResponse<T> validationError(String message, Map<String, String> errors) {
        return new ApiResponse<>(false, null, message, "VALIDATION_ERROR", errors, Instant.now().toEpochMilli());
    }
}
