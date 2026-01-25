package com.ecommerce.dto.intermediate;

import java.time.LocalTime;

public record BookedTimeInterval(
        LocalTime start,
        LocalTime end
) {}
