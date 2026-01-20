package com.ecommerce.dto.response.staff;

import com.ecommerce.dto.response.service.ServiceSummaryResponse;

import java.util.List;

public record StaffDetailResponse (
    StaffListResponse staffListResponse,
    List<ServiceSummaryResponse> services,
    List<WorkingHourResponse> workingHours,
    List<LeaveSummaryResponse> leaves,
    int upcomingAppointmentsCount
){}
