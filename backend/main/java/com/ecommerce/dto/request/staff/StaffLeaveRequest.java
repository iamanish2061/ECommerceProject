package com.ecommerce.dto.request.staff;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;


public record StaffLeaveRequest (
    @NotNull(message = "Leave date is required")
    @FutureOrPresent(message = "Date cannot be in the past")
    @JsonFormat(pattern = "yyyy-MM-dd")
    LocalDate leaveDate,

    // If null, full day leave
    LocalTime startTime,
    LocalTime endTime,

    @NotBlank(message = "Reason is required")
    String reason
){}
