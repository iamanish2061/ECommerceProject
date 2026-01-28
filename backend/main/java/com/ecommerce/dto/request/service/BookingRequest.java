package com.ecommerce.dto.request.service;

import com.ecommerce.model.payment.PaymentMethod;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;

public record BookingRequest (

        @NotNull(message = "Service ID is required")
        Long serviceId,

        Long staffId,

        @NotNull(message = "Booking date is required")
        @FutureOrPresent(message = "Date cannot be in the past")
        @JsonFormat(pattern = "yyyy-MM-dd")
        LocalDate bookingDate,

        @NotNull(message = "Booking time is required")
        @JsonFormat(pattern = "HH:mm:ss")
        LocalTime startTime,

        @NotNull(message = "Booking time is required")
        @JsonFormat(pattern = "HH:mm:ss")
        LocalTime endTime,

        String specialNotes,

        @NotNull(message = "Payment method is required!")
        PaymentMethod paymentMethod
){}