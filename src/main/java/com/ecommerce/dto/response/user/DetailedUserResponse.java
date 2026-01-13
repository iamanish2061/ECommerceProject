package com.ecommerce.dto.response.user;

import com.ecommerce.dto.response.address.DetailedAddress;

import java.util.Map;

public record DetailedUserResponse(
    DetailedUser user,
    Map<String, DetailedAddress> addresses
) {}

