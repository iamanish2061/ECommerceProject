package com.ecommerce.dto.request.order;

import com.ecommerce.model.payment.PaymentMethod;
import com.ecommerce.model.address.AddressType;
import com.ecommerce.validation.ValidNumber;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record PlaceOrderRequest (

        @ValidNumber
        String contactNumber,

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
        String landmark,

        @NotNull(message = "Payment method is required!")
        PaymentMethod paymentMethod,

        @NotNull(message = "Invalid delivery charge")
        Double deliveryCharge
){}
