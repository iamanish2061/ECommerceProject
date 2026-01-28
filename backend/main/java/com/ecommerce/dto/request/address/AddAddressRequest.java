package com.ecommerce.dto.request.address;

import com.ecommerce.model.address.AddressType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AddAddressRequest(
        @NotNull(message = "AddressType is required!")
        AddressType type,

        @NotNull(message = "Latitude is required!")
        Double latitude,

        @NotNull(message = "Longitude is required!")
        Double longitude,

        @NotBlank(message = "Province is required!")
        String province,

        @NotBlank(message = "District is required!")
        String district,

        @NotBlank(message = "Place is required!")
        String place,

        @NotBlank(message = "Landmark is required!")
        String landmark
) {}
