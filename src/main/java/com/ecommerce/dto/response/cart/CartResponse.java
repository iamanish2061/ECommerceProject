package com.ecommerce.dto.response.cart;

import com.ecommerce.dto.response.product.BriefProductsResponse;

public record CartResponse(
        BriefProductsResponse product,
        int quantity
) {}