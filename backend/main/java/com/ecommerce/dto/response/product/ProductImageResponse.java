package com.ecommerce.dto.response.product;

public record ProductImageResponse(
        String url,
        String altText,
        boolean thumbnail
) {
}
