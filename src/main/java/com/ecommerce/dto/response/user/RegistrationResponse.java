package com.ecommerce.dto.response.user;

public record RegistrationResponse(
        DriverInfoResponse response,
        String username
) {
}
