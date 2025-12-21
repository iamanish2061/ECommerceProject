package com.ecommerce.dto.response.order;

import com.ecommerce.dto.response.address.AddressResponse;
import com.ecommerce.dto.response.payment.PaymentResponse;
import com.ecommerce.dto.response.user.AllUsersResponse;
import com.ecommerce.model.order.OrderStatus;


import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record SingleOrderResponse(
    Long orderId,
    AllUsersResponse user,
    BigDecimal totalAmount,
    OrderStatus status,
    LocalDateTime createdAt,
    List<OrderItemResponse> orderItems,
    AddressResponse address,
    PaymentResponse payment
) {}
