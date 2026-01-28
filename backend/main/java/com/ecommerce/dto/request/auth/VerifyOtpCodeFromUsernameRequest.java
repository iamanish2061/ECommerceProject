package com.ecommerce.dto.request.auth;

import com.ecommerce.validation.ValidUsername;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record VerifyOtpCodeFromUsernameRequest(
        @ValidUsername
        String username,

        @NotBlank(message = "Verification code is required!")
        @Pattern(regexp = "^\\d{6}$", message = "Invalid OTP Code!")
        String code
) {}
