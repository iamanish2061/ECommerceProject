package com.ecommerce.dto.request.product;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

public record ProductRequest (
        @NotBlank(message = "SKU is required")
        @Size(max = 60)
        String sku,

        @NotBlank(message = "Title is required")
        @Size(max = 255)
        String title,

        @Size(max = 500)
        String shortDescription,

        String description,

        @NotBlank(message = "Brand Name is required")
        String brandSlug,

        @NotBlank(message = "Category Name is required")
        String categorySlug,

        @NotNull
        @DecimalMin("0.00")
        BigDecimal costPrice,

        @NotNull
        @DecimalMin("0.00")
        BigDecimal sellingPrice,

        @Min(0)
        Integer stock,

        @Size(max = 30)
        String sizeMl, // "50ml", "100ml", "200g"

        boolean active,

        // Tags — send as list of tag slugs (e.g. "beard-growth", "sulfate-free")
        Set<String> tagSlugs,

        // Images — admin uploads or pastes URLs
        @NotEmpty(message = "At least one image required")
        List<AddProductImageRequest> images
) {}
