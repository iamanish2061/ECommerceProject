package com.ecommerce.dto.response.user;

public record DriverDashboardResponse (
        DriverInfoResponse response,
        String username,
        String profileUrl,
        String fullName
){
}
