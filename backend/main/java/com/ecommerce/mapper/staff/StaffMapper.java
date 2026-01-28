package com.ecommerce.mapper.staff;

import com.ecommerce.dto.response.staff.StaffListResponse;
import com.ecommerce.dto.response.staff.StaffSummaryResponse;
import com.ecommerce.model.user.Staff;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface StaffMapper {

    @Mapping(target = "staffId", source = "id")
    @Mapping(target = "name", source = "user.fullName")
    @Mapping(target = "profileUrl", source = "user.profileUrl")
    StaffSummaryResponse mapEntityToStaffSummaryResponse(Staff staff);

    @Mapping(target = "staffId", source = "staff.id")
    @Mapping(target = "fullName", source = "staff.user.fullName")
    @Mapping(target = "username", source = "staff.user.username")
    @Mapping(target = "email", source = "staff.user.email")
    @Mapping(target = "profileUrl", source = "staff.user.profileUrl")
    @Mapping(target = "totalServices", source = "totalServices")
    @Mapping(target="expertiseIn", source = "staff.expertiseIn")
    @Mapping(target="joinedDate", source = "staff.joinedDate")
    StaffListResponse mapEntityToStaffListResponse(Staff staff, int totalServices);

}
