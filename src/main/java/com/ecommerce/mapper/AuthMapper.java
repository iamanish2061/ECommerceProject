package com.ecommerce.mapper;

import com.ecommerce.dto.response.auth.AuthResponse;
import com.ecommerce.model.user.UserModel;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface AuthMapper {

    @Mapping(source = "accessToken", target = "accessToken")
    @Mapping(target = "tokenType", defaultValue = "Bearer")
    @Mapping(source ="accessTokenExpiration", target = "expiresIn")
    @Mapping(source = "user.id", target = "userId")
    @Mapping(source = "user.fullName", target = "fullName")
    @Mapping(source = "user.username", target = "username")
    @Mapping(source = "user.email", target = "email")
    @Mapping(source = "user.role", target = "role")
    AuthResponse mapEntityToResponse(UserModel user, String accessToken, Long accessTokenExpiration);

}
