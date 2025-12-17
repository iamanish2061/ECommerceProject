package com.ecommerce.dto.response.product;

import java.math.BigDecimal;

public record BriefProductsResponse(
        Long id,
        String title,
        String shortDescription,
        BigDecimal price,
        Integer stock,
        String imageUrl
){}
