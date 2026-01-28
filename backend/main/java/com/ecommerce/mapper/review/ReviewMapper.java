package com.ecommerce.mapper.review;

import com.ecommerce.dto.response.review.ReviewResponse;
import com.ecommerce.model.review.Review;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ReviewMapper {

    @Mapping(target = "username", source = "user.username")
    @Mapping(target = "profileUrl", source = "user.profileUrl")
    ReviewResponse mapEntityToReviewResponse(Review review);

}
