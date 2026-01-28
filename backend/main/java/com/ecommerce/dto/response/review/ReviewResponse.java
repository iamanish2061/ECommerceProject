package com.ecommerce.dto.response.review;

import java.time.LocalDateTime;

public record ReviewResponse(
        Long id,
        String username,
        String profileUrl,
        Integer rating,
        String title,
        String comment,
        LocalDateTime createdAt
) {}
