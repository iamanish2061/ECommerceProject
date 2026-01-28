package com.ecommerce.mapper.product;


import com.ecommerce.dto.response.product.CategoryResponse;
import com.ecommerce.model.product.CategoryModel;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface CategoryMapper {

    CategoryResponse mapEntityToCategoryResponse(CategoryModel categoryModel);

}

