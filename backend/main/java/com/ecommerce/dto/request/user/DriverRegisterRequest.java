package com.ecommerce.dto.request.user;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record DriverRegisterRequest(
        @NotBlank(message = "License number is required!")
        String licenseNumber,

        @NotNull(message = "License date is required!")
        @Future(message = "Please check your license expiry date!")
        LocalDate licenseExpiry,

        @NotBlank(message = "Vehicle number is required!")
        String vehicleNumber
) {
}
