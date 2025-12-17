package com.ecommerce.dto.response.product;

import java.math.BigDecimal;
import java.util.List;

public record SingleProductResponse(
        Long id,
        String sku,
        String title,
        String shortDescription,
        String description,
        BrandResponse brand,
        CategoryResponse category,
        BigDecimal price,
        Integer stock,
        String sizeMl,
        List<TagResponse> tags,
        List<ProductImageResponse> images
) {}
