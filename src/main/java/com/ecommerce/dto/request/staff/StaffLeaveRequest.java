package com.ecommerce.dto.request.staff;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;


public record StaffLeaveRequest (
    @NotNull(message = "Leave date is required")
    LocalDate leaveDate,

    // If null, full day leave
    LocalTime startTime,
    LocalTime endTime,

    @NotBlank(message = "Reason is required")
    String reason
){}
