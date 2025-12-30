package com.ecommerce.dto.intermediate;

import java.math.BigDecimal;

public record OrderItemDTO(
        Long productId,
        Integer quantity,
        BigDecimal priceAtPurchase
) {}