package com.ecommerce.dto.response.appointment;

import com.ecommerce.model.service.AppointmentStatus;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

@Builder
public record BookingResponse(
                Long appointmentId,
                AppointmentStatus status,

                // Service details
                Long serviceId,
                String serviceName,
                Integer durationMinutes,

                // Staff details
                Long staffId,
                String staffName,
                String staffProfileUrl,

                // Booking time
                LocalDate appointmentDate,
                LocalTime startTime,
                LocalTime endTime,

                // Payment info
                BigDecimal totalAmount,
                BigDecimal advanceAmount, // 10% of total
                String paymentUrl, // Redirect URL for payment
                String transactionId, // For tracking

                String specialNotes) {
}
