package com.ecommerce.dto.response.address;

import com.ecommerce.model.user.AddressType;

import java.math.BigDecimal;

public record AddressWithDeliveryChargeResponse(
        AddressType addressType,
        String province,
        String district,
        String place,
        String landmark,
        Double longitude,
        Double latitude,
        BigDecimal deliveryCharge
) {
}
