package com.ecommerce.dto.response.user;

public record DetailedAddress(
        Long addressId,
        String province,
        String district,
        String place,
        String landmark,
        Double latitude,
        Double longitude
){}
