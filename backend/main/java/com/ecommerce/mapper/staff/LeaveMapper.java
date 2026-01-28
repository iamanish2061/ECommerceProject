package com.ecommerce.mapper.staff;

import com.ecommerce.dto.response.staff.LeaveSummaryResponse;
import com.ecommerce.model.service.StaffLeave;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface LeaveMapper {

    LeaveSummaryResponse mapEntityToLeaveSummaryResponse(StaffLeave leave);

}
