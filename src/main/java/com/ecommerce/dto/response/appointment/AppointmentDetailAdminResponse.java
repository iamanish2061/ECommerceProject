package com.ecommerce.dto.response.appointment;

import com.ecommerce.dto.response.payment.PaymentResponse;
import com.ecommerce.dto.response.service.ServiceSummaryResponse;
import com.ecommerce.dto.response.staff.StaffSummaryResponse;
import com.ecommerce.dto.response.user.AllUsersResponse;
import com.ecommerce.model.service.AppointmentStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

public record AppointmentDetailAdminResponse(
                Long appointmentId,
                LocalDate appointmentDate,
                LocalTime startTime,
                LocalTime endTime,
                AppointmentStatus status,
                String specialNotes,
                BigDecimal totalAmount,

                ServiceSummaryResponse serviceResponse,
                PaymentResponse paymentResponse,
                StaffSummaryResponse staffResponse,
                AllUsersResponse userResponse) {
}
