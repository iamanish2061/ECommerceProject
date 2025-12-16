package com.ecommerce.dto.response.auth;

import com.ecommerce.model.user.Role;

public record AuthResponse(
        String accessToken,
        String tokenType,
        Long expiresIn,
        Long userId,
        String fullName,
        String username,
        String email,
        Role role
) {}
