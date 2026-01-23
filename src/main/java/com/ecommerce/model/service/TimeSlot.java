package com.ecommerce.model.service;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Represents a bookable time slot for salon appointments.
 * Used in recommendation algorithm and availability display.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TimeSlot {

    private LocalDate date;
    private LocalTime start;
    private LocalTime end;
    private Long staffId;
    private String staffName; // For UI display
    private String staffProfileUrl; // Staff profile picture
    private double score; // Recommendation score (0-1)
    private boolean booked;

    // Score breakdown for transparency
    private double preferenceScore;
    private double workloadScore;
    private double timeFitScore;
}
