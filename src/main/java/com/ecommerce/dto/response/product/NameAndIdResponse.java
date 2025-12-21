package com.ecommerce.dto.response.product;

import java.math.BigDecimal;

public record NameAndIdResponse(
        Long id,
        String title,
        int stock,
        BigDecimal price
) {
}
