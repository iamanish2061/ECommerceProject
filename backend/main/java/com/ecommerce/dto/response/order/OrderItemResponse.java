package com.ecommerce.dto.response.order;

import com.ecommerce.dto.response.product.BriefProductsResponse;

import java.math.BigDecimal;

public record OrderItemResponse(
        Long orderItemId,
        BriefProductsResponse product,
        int quantity,
        BigDecimal price
) {
}
