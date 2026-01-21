package com.ecommerce.dto.response.order;

import com.ecommerce.model.order.OrderStatus;

import java.math.BigDecimal;

public record OrderSummaryResponse(
        Long orderId,
        BigDecimal totalAmount,
        OrderStatus status,
        String phoneNumber
) {
}
