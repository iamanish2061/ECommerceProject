package com.ecommerce.mapper.product;

import com.ecommerce.dto.response.product.BrandResponse;
import com.ecommerce.model.product.BrandModel;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface BrandMapper {

    BrandResponse mapEntityToBrandResponse(BrandModel brandModel);

}
