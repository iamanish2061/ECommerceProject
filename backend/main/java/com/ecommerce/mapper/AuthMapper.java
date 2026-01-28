package com.ecommerce.mapper;

import com.ecommerce.dto.response.auth.AuthResponse;
import com.ecommerce.model.user.Role;
import com.ecommerce.model.user.UserModel;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

@Mapper(componentModel = "spring")
public interface AuthMapper {

    @Mapping(target = "tokenType", constant = "Bearer")
    @Mapping(source = "accessTokenExpiration", target = "expiresIn")
    @Mapping(source = "user.id", target = "userId")
    @Mapping(source = "user.fullName", target = "fullName")
    @Mapping(source = "user.username", target = "username")
    @Mapping(source = "user.email", target = "email")
    @Mapping(source = "user.role", target = "role")
    @Mapping(source = "user.role", target = "redirectionPage", qualifiedByName = "returnRedirectionPage")
    AuthResponse mapEntityToResponse(
            UserModel user,
            String accessToken,
            Long accessTokenExpiration
    );

    @Named("returnRedirectionPage")
    default String returnRedirectionPage(Role role) {
        if (role == null) return "/product.html";

        return switch (role) {
            case ROLE_ADMIN -> "/admin/index.html";
            case ROLE_DRIVER -> "/driver/index.html";
            case ROLE_STAFF -> "/staff/index.html";
            default -> "/product.html";
        };
    }


}
