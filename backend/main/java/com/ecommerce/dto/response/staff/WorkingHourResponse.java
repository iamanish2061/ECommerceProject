package com.ecommerce.dto.response.staff;

import java.time.DayOfWeek;
import java.time.LocalTime;

public record WorkingHourResponse(
        Long id,
        DayOfWeek dayOfWeek,
        LocalTime startTime,
        LocalTime endTime,
        boolean isWorkingDay
){}