package com.ecommerce.controller.product;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record TagOperationRequest(

        @NotEmpty(message = "Tag is required")
        List<String> tagSlugs
) {
}
