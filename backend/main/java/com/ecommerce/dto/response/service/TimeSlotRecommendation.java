package com.ecommerce.dto.response.service;

import com.ecommerce.dto.response.staff.StaffSummaryResponse;
import lombok.Builder;

import java.time.LocalDate;
import java.time.LocalTime;

@Builder
public record TimeSlotRecommendation(
    LocalDate appointmentDate,
    LocalTime startTime,
    LocalTime endTime,

    StaffSummaryResponse staff,

    // Overall score (0-100 for display)
    int matchScore,

    // Score breakdown (for potential tooltip/details)
    int preferenceScore, // Based on user's time preferences
    int workloadScore, // Staff availability balance
    int timeFitScore,  // Match with user's typical booking time

    String matchLabel, // "Best Match", "Great", "Good", etc.
    boolean isTopPick
){}
