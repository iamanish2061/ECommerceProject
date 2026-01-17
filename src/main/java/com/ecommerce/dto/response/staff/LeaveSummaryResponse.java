package com.ecommerce.dto.response.staff;

import java.time.LocalDate;
import java.time.LocalTime;

public record LeaveSummaryResponse(
    Long id,
    LocalDate leaveDate,
    LocalTime startTime,
    LocalTime endTime,
    String reason
){}
