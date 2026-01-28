package com.ecommerce.dto.request.staff;

import com.ecommerce.model.user.StaffRole;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;

import java.util.List;

@Builder
public record StaffAssignRequest (
    @NotNull(message = "User ID is required")
    Long userId,

    @NotNull(message = "Expertise role is required")
    StaffRole expertiseIn,

    // Service IDs to assign initially
    List<Long> serviceIds
){}
