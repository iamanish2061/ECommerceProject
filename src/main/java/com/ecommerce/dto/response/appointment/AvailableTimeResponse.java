package com.ecommerce.dto.response.appointment;

import java.time.LocalTime;

public record AvailableTimeResponse(
        LocalTime startTime,
        LocalTime endTime
) {}
