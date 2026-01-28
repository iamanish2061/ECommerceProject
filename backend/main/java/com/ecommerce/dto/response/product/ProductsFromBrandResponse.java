package com.ecommerce.dto.response.product;

import java.util.List;

public record ProductsFromBrandResponse(
        BrandResponse brandResponse,
        List<BriefProductsResponse> products
) {
}
