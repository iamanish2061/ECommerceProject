package com.ecommerce.dto.intermediate;

import com.ecommerce.dto.request.order.PlaceOrderRequest;

public record TempOrderDetails(
        Long userId,
        Long productId,
        PlaceOrderRequest request
) {
}
