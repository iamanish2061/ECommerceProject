package com.ecommerce.dto.response.user;

import com.ecommerce.dto.response.address.DetailedAddress;

public record DetailedUserResponse(
    DetailedUser user,
    DetailedAddress address
) {}

