package com.ecommerce.dto.response.user;

public record DetailUserResponse(
    DetailedUser user,
    DetailedAddress address
) {}

