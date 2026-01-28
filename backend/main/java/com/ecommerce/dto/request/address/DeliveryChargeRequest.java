package com.ecommerce.dto.request.address;

import jakarta.validation.constraints.NotNull;

public record DeliveryChargeRequest(

        @NotNull(message = "Please choose on map")
        Double latitude,

        @NotNull(message = "Please choose on map")
        Double longitude
) {
}
