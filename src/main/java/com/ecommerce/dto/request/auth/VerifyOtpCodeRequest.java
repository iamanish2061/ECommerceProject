package com.ecommerce.dto.request.auth;

import com.ecommerce.validation.ValidEmail;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record VerifyOtpCodeRequest(
        @ValidEmail
        String email,

        @NotBlank(message = "Verification code is required!")
        @Pattern(regexp = "^\\d{6}$", message = "Invalid OTP Code!")
        String code
) {
}
