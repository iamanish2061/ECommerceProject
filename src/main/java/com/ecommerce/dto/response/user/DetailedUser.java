package com.ecommerce.dto.response.user;

import com.ecommerce.model.user.Role;
import com.ecommerce.model.user.UserStatus;

import java.time.LocalDateTime;

public record DetailedUser(
    String profileUrl,
    Long userId,
    String fullName,
    String username,
    String email,
    Role role,
    UserStatus status,
    LocalDateTime createdAt
){}
