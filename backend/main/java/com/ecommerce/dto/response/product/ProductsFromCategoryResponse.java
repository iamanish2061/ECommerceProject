package com.ecommerce.dto.response.product;

import java.util.List;

public record ProductsFromCategoryResponse(
        CategoryResponse categoryResponse,
        List<BriefProductsResponse> products
) {}
