package com.ecommerce.dto.response.user;

public record DetailedUserResponse(
    DetailedUser user,
    DetailedAddress address
) {}

