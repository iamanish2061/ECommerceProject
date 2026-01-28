package com.ecommerce.dto.response.report;

import java.math.BigDecimal;

public record TopServiceReportResponse(
        Long id,
        String name,
        Long bookings,
        BigDecimal revenue
) {
}
