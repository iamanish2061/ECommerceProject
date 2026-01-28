package com.ecommerce.dto.response.report;

import java.util.List;

public record SalesReportResponse(
        List<String> labels,
        List<Double> data
) {
}
