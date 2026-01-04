package com.ecommerce.mapper.user;

import com.ecommerce.dto.response.user.*;
import com.ecommerce.model.address.AddressModel;
import com.ecommerce.model.user.Driver;
import com.ecommerce.model.user.Staff;
import com.ecommerce.model.user.UserModel;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface UserMapper {

    @Mapping(source = "id", target = "userId")
    AllUsersResponse mapEntityToUserResponse(UserModel user);

    @Mapping(source = "id", target = "userId")
    DetailedUser mapEntityToDetailedUser(UserModel userModel);

    DriverInfoResponse mapEntityToDriverInfoResponse(Driver driver);

    StaffInfoResponse mapEntityToStaffInfoResponse(Staff staff);
}
