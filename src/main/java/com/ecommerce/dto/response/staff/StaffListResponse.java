package com.ecommerce.dto.response.staff;

import com.ecommerce.model.user.StaffRole;

import java.time.LocalDate;

public record StaffListResponse(
    Long staffId,
    String fullName,
    String username,
    String email,
    String profileUrl,
    StaffRole expertiseIn,
    LocalDate joinedDate,
    int totalServices
){}
