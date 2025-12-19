package com.ecommerce.dto.response.user;

import com.ecommerce.model.service.ServiceModel;
import com.ecommerce.model.service.StaffLeave;
import com.ecommerce.model.user.StaffRole;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

public record StaffInfoResponse(
        StaffRole expertiseIn,
        List<StaffLeave> staffLeave,
        LocalDate joinedDate,
        Set<ServiceModel> services
) {
}
