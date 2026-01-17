package com.ecommerce.mapper.staff;

import com.ecommerce.dto.response.staff.WorkingHourResponse;
import com.ecommerce.model.service.StaffWorkingHours;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface WorkingHourMapper {

    WorkingHourResponse mapEntityToWorkingHourResponse(StaffWorkingHours workingHours);
}
