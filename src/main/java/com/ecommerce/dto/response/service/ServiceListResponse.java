package com.ecommerce.dto.response.service;

import java.math.BigDecimal;


public record ServiceListResponse(
        Long id,
        String name,
        String description,
        BigDecimal price,
        Integer durationMinutes,
        String category,
        String imageUrl,
        boolean active
){}
