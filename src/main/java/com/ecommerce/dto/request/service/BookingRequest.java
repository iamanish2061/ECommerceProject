package com.ecommerce.dto.request.service;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record BookingRequest (
    @NotNull(message = "Service ID is required")
    Long serviceId,
    // Optional - if null, algorithm will consider all qualified staff
    Long staffId,
    // For manual time selection
    LocalDateTime selectedDateTime,
    LocalDate recommendationStartDate,
    LocalDate recommendationEndDate,
    // Optional customer notes
    String specialNotes
){}
