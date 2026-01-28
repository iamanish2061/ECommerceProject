package com.ecommerce.dto.request.staff;

import java.time.DayOfWeek;
import java.time.LocalTime;

public record WorkingHoursRequest (
        DayOfWeek dayOfWeek,
        LocalTime startTime,
        LocalTime endTime,
        boolean isWorkingDay
){}
