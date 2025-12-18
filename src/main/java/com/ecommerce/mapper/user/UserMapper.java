package com.ecommerce.mapper.user;

import com.ecommerce.dto.response.user.AllUsersResponse;
import com.ecommerce.dto.response.user.DetailedAddress;
import com.ecommerce.dto.response.user.DetailedUser;
import com.ecommerce.model.user.AddressModel;
import com.ecommerce.model.user.UserModel;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface UserMapper {

    @Mapping(source = "id", target = "userId")
    AllUsersResponse mapEntityToUserResponse(UserModel user);

    @Mapping(source = "id", target = "userId")
    DetailedUser mapEntityToDetailedUser(UserModel userModel);

    DetailedAddress mapEntityToDetailedAddress(AddressModel address);
}
