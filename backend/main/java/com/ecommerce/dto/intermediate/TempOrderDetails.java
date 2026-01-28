package com.ecommerce.dto.intermediate;

import com.ecommerce.model.address.DeliveryAddress;

import java.math.BigDecimal;
import java.util.List;

public record TempOrderDetails(
        Long productId,        // 0 for cart, specific ID for "Buy Now"
        List<OrderItemDTO> items,
        Long userId,
        DeliveryAddress address,
        BigDecimal deliveryCharge,
        String contactNumber,
        BigDecimal totalIncludingDeliveryCharge
) {}

