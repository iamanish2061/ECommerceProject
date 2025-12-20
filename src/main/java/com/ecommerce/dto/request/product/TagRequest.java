package com.ecommerce.dto.request.product;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record TagRequest(
        @NotEmpty(message = "Tag names list cannot be empty.")
        List<String> names
){}