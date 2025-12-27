package com.ecommerce.dto.response.address;

import com.ecommerce.model.address.AddressType;

public record AddressResponse(
        Long addressId,
        String province,
        String district,
        String place,
        String landmark
) {
}
