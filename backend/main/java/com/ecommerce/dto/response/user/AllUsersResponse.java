package com.ecommerce.dto.response.user;

import com.ecommerce.model.user.Role;
import com.ecommerce.model.user.UserStatus;

public record AllUsersResponse(
        Long userId,
        String username,
        Role role,
        UserStatus status
) {}
