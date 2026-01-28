package com.ecommerce.dto.response.appointment;

import com.ecommerce.dto.response.service.ServiceSummaryResponse;
import com.ecommerce.model.payment.PaymentStatus;
import com.ecommerce.model.service.AppointmentStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

public record AppointmentResponse(
            Long appointmentId,
            String username, // for admin side
            AppointmentStatus status,
            LocalDate appointmentDate,
            LocalTime startTime,
            LocalTime endTime,
            BigDecimal totalAmount,
            PaymentStatus paymentStatus,
            ServiceSummaryResponse response
) {}
