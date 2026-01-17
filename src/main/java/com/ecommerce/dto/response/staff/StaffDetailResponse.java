package com.ecommerce.dto.response.service;


import com.ecommerce.dto.response.staff.LeaveSummaryResponse;
import com.ecommerce.dto.response.staff.StaffListResponse;
import com.ecommerce.dto.response.staff.WorkingHourResponse;

import java.util.List;

public record StaffDetailResponse (
    StaffListResponse staffListResponse,
    List<ServiceSummaryResponse> services,
    List<WorkingHourResponse> workingHours,
    List<LeaveSummaryResponse> leaves,
    int upcomingAppointmentsCount
){}
