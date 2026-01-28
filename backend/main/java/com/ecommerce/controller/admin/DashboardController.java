package com.ecommerce.controller.admin;

import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.admin.DashboardResponse;
import com.ecommerce.dto.response.appointment.AppointmentResponse;
import com.ecommerce.dto.response.order.OrderResponse;
import com.ecommerce.dto.response.staff.LeaveDetailForAdminResponse;
import com.ecommerce.dto.response.user.RegistrationResponse;
import com.ecommerce.model.service.LeaveStatus;
import com.ecommerce.model.user.VerificationStatus;
import com.ecommerce.service.admin.AdminUserService;
import com.ecommerce.service.admin.DashboardService;
import com.ecommerce.service.staff.StaffManagementService;
import com.ecommerce.validation.ValidId;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;
    private final StaffManagementService staffManagementService;
    private final AdminUserService userService;

    @GetMapping("/stats")
    @Operation(summary = "to fetch the stats for dashboard")
    public ResponseEntity<ApiResponse<DashboardResponse>> getDashboardStats(){
        DashboardResponse response = dashboardService.getDashboardStats();
        return ResponseEntity.ok(ApiResponse.ok(response, "Stats fetch successfully"));
    }

    @GetMapping("/orders")
    @Operation(summary = "to fetch top 5 orders to list on admin dashboard")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getRecentOrders(){
        return ResponseEntity.ok(ApiResponse.ok(dashboardService.getRecentOrders(), "Fetched orders successfully"));
    }

    @GetMapping("/appointments")
    @Operation(summary = "to fetch top 5 appointments to list on admin dashboard")
    public ResponseEntity<ApiResponse<List<AppointmentResponse>>> getRecentAppointments(){
        return ResponseEntity.ok(ApiResponse.ok(dashboardService.getRecentAppointments(), "Fetched appointments successfully"));
    }

    @GetMapping("/leave-forms")
    @Operation(summary = "to fetch forms to list on admin dashboard")
    public ResponseEntity<ApiResponse<List<LeaveDetailForAdminResponse>>> getLeaveForms(){
        return ResponseEntity.ok(ApiResponse.ok(dashboardService.getLeaveForms(), "Fetched leave forms successfully"));
    }

    @PutMapping("/leave-forms/{staffId}/{leaveId}")
    @Operation(summary = "to update staff leave request")
    public ResponseEntity<ApiResponse<?>> updateLeaveRequestStatus(
            @ValidId @PathVariable Long staffId,
            @ValidId @PathVariable Long leaveId,
            @RequestParam LeaveStatus status
    ) {
        staffManagementService.staffLeaveAction(staffId, leaveId, status);
        return ResponseEntity.ok(ApiResponse.ok("Leave request updated successfully"));
    }

    @GetMapping("driver-registration-forms")
    @Operation(summary = "to fetch driver registration forms on admin dashboard")
    public ResponseEntity<ApiResponse<List<RegistrationResponse>>> getDriverRegistrationForms(){
        return ResponseEntity.ok(ApiResponse.ok(dashboardService.getDriverRegistrationForms(), "Fetched driver forms successfully"));
    }

    @PutMapping("/driver-registration-forms/{userId}")
    @Operation(summary = "to update driver registration (approve or reject)")
    public ResponseEntity<ApiResponse<?>> updateDriverRegistrationStatus(
            @ValidId @PathVariable Long userId,
            @RequestParam VerificationStatus status
    ){
        userService.updateDriverRegistrationStatus(userId, status);
        return ResponseEntity.ok(ApiResponse.ok("Driver registration handled successfully"));
    }

}
