package com.ecommerce.dto.response.order;

import com.ecommerce.dto.response.address.AddressResponse;
import com.ecommerce.dto.response.payment.PaymentResponse;
import com.ecommerce.model.order.OrderStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record UserOrderResponse(
        Long orderId,
        BigDecimal totalAmount,
        OrderStatus status,
        LocalDateTime createdAt,
        List<OrderItemResponse> orderItems,
        AddressResponse address,
        PaymentResponse payment
) {
}
