package com.ecommerce.dto.response.product;

import java.math.BigDecimal;

public record SingleProductWithCostPriceResponse(
    SingleProductResponse product,
    BigDecimal costPrice
){}
