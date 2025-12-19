package com.ecommerce.dto.request.product;

import jakarta.validation.constraints.NotBlank;

public record AddProductImageRequest(
        @NotBlank(message = "Name is needed")
        String name, // "/uploads/products/beardo-oil-front.jpg"

        String altText,

        boolean thumbnail
) {}
