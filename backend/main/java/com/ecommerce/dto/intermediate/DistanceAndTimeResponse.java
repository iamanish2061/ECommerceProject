package com.ecommerce.dto.intermediate;

import java.util.List;

public record DistanceAndTimeResponse(
        String code,
        List<Route> routes
) {
}

