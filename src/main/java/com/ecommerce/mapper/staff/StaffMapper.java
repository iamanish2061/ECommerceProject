package com.ecommerce.mapper.staff;

import com.ecommerce.dto.response.staff.StaffSummaryResponse;
import com.ecommerce.model.user.Staff;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface StaffMapper {

    @Mapping(target = "staffId", source = "id")
    @Mapping(target = "name", source = "user.fullName")
    @Mapping(target = "profileUrl", source = "user.profileUrl")
    StaffSummaryResponse mapModelToStaffSummaryResponse(Staff staff);

}
