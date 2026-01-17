package com.ecommerce.dto.response.service;

public record ServiceSummaryResponse(
    Long serviceId,
    String name,
    String category
){}
