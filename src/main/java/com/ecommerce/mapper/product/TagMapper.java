package com.ecommerce.mapper.product;


import com.ecommerce.dto.response.product.TagResponse;
import com.ecommerce.model.product.TagModel;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface TagMapper {

    TagResponse mapEntityToTagResponse(TagModel tagModel);

}

