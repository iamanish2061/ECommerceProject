package com.ecommerce.dto.response.staff;

import com.ecommerce.dto.response.service.ServiceSummaryResponse;

import java.util.List;

public record StaffResponse(
    StaffListResponse staffListResponse,
    List<ServiceSummaryResponse> services,
    List<WorkingHourResponse> workingHours,
    long upcomingAppointmentsCount
){}
