package com.ecommerce.dto.intermediate;

import com.ecommerce.model.service.LeaveStatus;

import java.time.LocalDate;

public record StaffLeaveDTO(
        Long staffId,
        String username,
        LocalDate leaveDate,
        LeaveStatus status
) {}
