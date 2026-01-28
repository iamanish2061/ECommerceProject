package com.ecommerce.dto.response.appointment;

import com.ecommerce.model.service.AppointmentStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record AppointmentSummaryResponse(
        Long appointmentId,
        LocalDate appointmentDate,
        AppointmentStatus status,
        LocalDateTime createdAt
) {
}
