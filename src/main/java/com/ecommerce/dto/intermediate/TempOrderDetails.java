package com.ecommerce.dto.intermediate;

import com.ecommerce.model.order.OrderModel;

public record TempOrderDetails(
        Long productId,
        OrderModel order
) {
}
