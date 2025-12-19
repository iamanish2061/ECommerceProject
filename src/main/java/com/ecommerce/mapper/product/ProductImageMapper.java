package com.ecommerce.mapper.product;

import com.ecommerce.dto.response.product.ProductImageResponse;
import com.ecommerce.model.product.ProductImageModel;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface ProductImageMapper {

    ProductImageResponse mapEntityToProductImageResponse(ProductImageModel productImageModel);

}
