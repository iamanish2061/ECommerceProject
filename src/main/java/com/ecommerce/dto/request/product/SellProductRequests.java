package com.ecommerce.dto.request.product;

import com.ecommerce.validation.ValidId;
import com.ecommerce.validation.ValidQuantity;

public record SellProductRequests(
        @ValidId
        Long productId,
        @ValidQuantity
        int quantity
){}
