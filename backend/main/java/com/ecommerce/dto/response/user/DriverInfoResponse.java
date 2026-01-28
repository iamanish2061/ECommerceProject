package com.ecommerce.dto.response.user;

import com.ecommerce.model.user.VerificationStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record DriverInfoResponse(
        Long id,
        VerificationStatus verified,
        String licenseNumber,
        LocalDate licenseExpiry,
        String vehicleNumber,
        String licenseUrl,
        LocalDateTime submittedAt,
        LocalDateTime verifiedAt
) {
}
