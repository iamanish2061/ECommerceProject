package com.ecommerce.mapper.product;

import com.ecommerce.dto.response.product.BriefProductsResponse;
import com.ecommerce.model.product.ProductImageModel;
import com.ecommerce.model.product.ProductModel;
import com.ecommerce.model.product.TagModel;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.util.List;

@Mapper(componentModel = "spring")
public interface ProductMapper {

    @Mapping(source = "images", target = "imageUrl", qualifiedByName = "pickThumbnail")
    BriefProductsResponse mapEntityToBriefProductsResponse(ProductModel productModel);


    @Named("pickThumbnail")
    default String pickThumbnail(List<ProductImageModel> images) {
        return images.stream()
                .filter(img-> img.isThumbnail())
                .findFirst()
                .map(ProductImageModel::getUrl)
                .orElse(null);
    }
}
