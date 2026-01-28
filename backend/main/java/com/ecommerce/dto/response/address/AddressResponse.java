package com.ecommerce.dto.response.address;

public record AddressResponse(
        Long addressId,
        String province,
        String district,
        String place,
        String landmark
) {
}
