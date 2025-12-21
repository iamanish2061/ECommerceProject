package com.ecommerce.dto.response.address;

import com.ecommerce.model.user.AddressType;

public record AddressResponse(
        Long addressId,
        AddressType addressType,
        String province,
        String district,
        String city,
        String ward,
        String landmark
) {
}
