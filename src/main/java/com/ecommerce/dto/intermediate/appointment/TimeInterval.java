package com.ecommerce.dto.intermediate.appointment;

import java.time.LocalTime;

public record TimeInterval(
        LocalTime start,
        LocalTime end
) {}
