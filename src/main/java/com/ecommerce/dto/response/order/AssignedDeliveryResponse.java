package com.ecommerce.dto.response.order;

public record AssignedDeliveryResponse(
   Long orderId,
   String username,
   String phoneNumber,
   String district,
   String place,
   String landmark,
   double latitude,
   double longitude
) {}
