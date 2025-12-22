package com.ecommerce.dto.request.product;

import com.ecommerce.validation.ValidId;

public record BuyProductRequest(
        @ValidId
        Long productId,
        int quantity
) {
}
