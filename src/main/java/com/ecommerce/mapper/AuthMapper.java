package com.ecommerce.mapper;

import com.ecommerce.dto.response.auth.AuthResponse;
import com.ecommerce.model.user.UserModel;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface AuthMapper {

    @Mapping(target = "tokenType", constant = "Bearer")
    @Mapping(source = "accessTokenExpiration", target = "expiresIn")
    @Mapping(source = "id", target = "userId")
    @Mapping(source = "fullName", target = "fullName")
    @Mapping(source = "username", target = "username")
    @Mapping(source = "email", target = "email")
    @Mapping(source = "role", target = "role")
    AuthResponse mapEntityToResponse(
            UserModel user,
            String accessToken,
            Long accessTokenExpiration
    );
}
