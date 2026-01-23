package com.ecommerce.dto.response.staff;

public record LeaveDetailForAdminResponse(
        LeaveSummaryResponse response,
        Long staffId,
        String username
) {}
