package com.ecommerce.dto.response.order;

import com.ecommerce.model.order.OrderStatus;

public record AssignedDeliveryResponse(
   Long orderId,
   OrderStatus status,
   String username,
   String phoneNumber,
   String district,
   String place,
   String landmark,
   double latitude,
   double longitude
) {}
