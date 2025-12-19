package com.ecommerce.dto.response.product;

import java.util.List;

public record ProductsFromTagResponse(
        TagResponse tagResponse,
        List<BriefProductsResponse> products
) {}
