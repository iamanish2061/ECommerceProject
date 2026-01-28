package com.ecommerce.dto.request.service;

import java.math.BigDecimal;


public record ServiceUpdateRequest (
    String name,
    String description,
    BigDecimal price,
    Integer durationMinutes,
    String category
){}
