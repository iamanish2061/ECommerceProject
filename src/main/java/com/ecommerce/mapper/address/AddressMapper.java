package com.ecommerce.mapper.address;

import com.ecommerce.dto.response.address.AddressResponse;
import com.ecommerce.model.user.AddressModel;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface AddressMapper {

    @Mapping(source = "id", target = "addressId")
    @Mapping(source = "type", target = "addressType")
    AddressResponse mapEntityToAddressResponse(AddressModel address);

}