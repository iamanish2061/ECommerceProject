package com.ecommerce.dto.request.product;

import jakarta.validation.constraints.NotBlank;

public record TagRequest(
        @NotBlank(message = "Tag name cannot be empty.")
        String name
){}