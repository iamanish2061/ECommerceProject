package com.ecommerce.dto.request.service;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record AssignStaffToServiceRequest(
        @NotEmpty(message = "at least one staff is required")
        List<Long> staffIds
) {}
