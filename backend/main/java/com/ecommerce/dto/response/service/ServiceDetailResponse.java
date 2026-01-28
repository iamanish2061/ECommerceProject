package com.ecommerce.dto.response.service;

import com.ecommerce.dto.response.staff.StaffSummaryResponse;

import java.util.List;

public record ServiceDetailResponse(
        ServiceListResponse serviceListResponse,
        List<StaffSummaryResponse> specialists
) {}