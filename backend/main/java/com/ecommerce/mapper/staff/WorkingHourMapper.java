package com.ecommerce.mapper.staff;

import com.ecommerce.dto.response.staff.WorkingHourResponse;
import com.ecommerce.model.service.StaffWorkingHours;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface WorkingHourMapper {

    @Mapping(target = "isWorkingDay", source = "workingDay")
    WorkingHourResponse mapEntityToWorkingHourResponse(StaffWorkingHours workingHours);
}
