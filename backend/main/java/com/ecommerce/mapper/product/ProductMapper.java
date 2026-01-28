package com.ecommerce.mapper.product;

import com.ecommerce.dto.response.product.BriefProductsResponse;
import com.ecommerce.model.product.ProductImageModel;
import com.ecommerce.model.product.ProductModel;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.util.Set;

@Mapper(componentModel = "spring")
public interface ProductMapper {

    @Mapping(source = "sellingPrice", target = "price")
    @Mapping(source = "images", target = "imageUrl", qualifiedByName = "pickThumbnailPhoto")
    BriefProductsResponse mapEntityToBriefProductsResponse(ProductModel productModel);


    @Named("pickThumbnailPhoto")
    default String pickThumbnail(Set<ProductImageModel> images) {
        return images.stream()
                .filter(img-> img.isThumbnail())
                .findFirst()
                .map(ProductImageModel::getUrl)
                .orElse(null);
    }
}
