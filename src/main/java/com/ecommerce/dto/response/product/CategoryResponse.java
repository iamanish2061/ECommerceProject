package com.ecommerce.dto.response.product;

public record CategoryResponse(
        String name,
        String slug,
        String imageUrl
) {
}
