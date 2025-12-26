package com.ecommerce.dto.response.order;

import com.ecommerce.model.order.OrderStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record OrderResponse(
        Long orderId,
        String username,
        BigDecimal totalAmount,
        LocalDateTime createdAt,
        OrderStatus status,
        String phoneNumber
) {}
