package com.ecommerce.dto.request.order;

import com.ecommerce.model.order.OrderStatus;

public record UpdateOrderStatusRequest(
   OrderStatus status
) {}
