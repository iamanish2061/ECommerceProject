package com.ecommerce.dto.response.report;

import java.math.BigDecimal;

public record TopProductReportResponse(
        Long id,
        String name,
        String category,
        Long sales,
        BigDecimal revenue
) {
}
