package com.ecommerce.dto.response.user;

public record DetailedAddress(
    String province,
    String district,
    String city,
    String ward,
    String landmark,
    Double latitude,
    Double longitude
){}
