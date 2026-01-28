package com.ecommerce.dto.response.report;

import com.ecommerce.model.user.StaffRole;
import java.math.BigDecimal;

public record StaffPerformanceReportResponse(
        Long id,
        String name,
        StaffRole role,
        Long appointments,
        Double rating,
        BigDecimal revenue
) {
}
