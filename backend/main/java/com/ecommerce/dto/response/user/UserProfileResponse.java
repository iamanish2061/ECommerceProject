package com.ecommerce.dto.response.user;

import com.ecommerce.dto.response.address.DetailedAddress;

import java.time.LocalDateTime;
import java.util.Map;

public record UserProfileResponse(
    String profileUrl,
    Long userId,
    String fullName,
    String username,
    String email,
    LocalDateTime createdAt,
    Map<String, DetailedAddress> addresses
){}
