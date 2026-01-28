package com.ecommerce.dto.response.staff;

import com.ecommerce.model.user.StaffRole;

public record StaffSummaryResponse(
        Long staffId,
        String name,
        String profileUrl,
        StaffRole expertiseIn
) {}
