package com.ecommerce.mapper.address;

import com.ecommerce.dto.response.address.AddressResponse;
import com.ecommerce.dto.response.address.AddressWithDeliveryChargeResponse;
import com.ecommerce.model.user.AddressModel;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.math.BigDecimal;

@Mapper(componentModel = "spring")
public interface AddressMapper {

    @Mapping(source = "id", target = "addressId")
    @Mapping(source = "type", target = "addressType")
    AddressResponse mapEntityToAddressResponse(AddressModel address);


    @Mapping(source = "address.type", target = "addressType")
    @Mapping(source = "address.province", target = "province")
    @Mapping(source = "address.district", target = "district")
    @Mapping(source = "address.place", target = "place")
    @Mapping(source = "address.landmark", target = "landmark")
    @Mapping(source = "address.latitude", target = "latitude")
    @Mapping(source = "address.longitude", target = "longitude")
    @Mapping(source = "charge", target = "deliveryCharge")
    AddressWithDeliveryChargeResponse mapEntityToAddressWithDeliveryChargeResponse(AddressModel address, BigDecimal charge);


}