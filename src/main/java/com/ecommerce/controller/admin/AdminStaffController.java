package com.ecommerce.controller.admin;

import com.ecommerce.dto.request.staff.StaffAssignRequest;
import com.ecommerce.dto.request.staff.StaffLeaveRequest;
import com.ecommerce.dto.request.staff.WorkingHoursRequest;
import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.service.StaffDetailResponse;
import com.ecommerce.dto.response.staff.StaffListResponse;
import com.ecommerce.service.staff.StaffManagementService;
import com.ecommerce.validation.ValidId;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/staff")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Validated
public class AdminStaffController {

    private final StaffManagementService staffManagementService;

    @GetMapping
    @Operation(summary = "to fetch all staff to list in admin ui")
    public ResponseEntity<ApiResponse<List<StaffListResponse>>> getAllStaff() {
        return ResponseEntity.ok(
                ApiResponse.ok(staffManagementService.getAllStaff(), "Fetched staff successfully"));
    }

    @GetMapping("/search")
    @Operation(summary = "to fetch searched staff")
    public ResponseEntity<ApiResponse<List<StaffListResponse>>> searchStaff(
            @RequestParam String query
    ) {
        return ResponseEntity.ok(
                ApiResponse.ok(staffManagementService.searchStaff(query), "Fetched searched staff successfully"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "to get detail of staff")
    public ResponseEntity<ApiResponse<StaffDetailResponse>> getStaffDetail(
            @ValidId @PathVariable Long id
    ) {
        return ResponseEntity.ok(
                ApiResponse.ok(staffManagementService.getStaffDetail(id), "Fetched detail of staff: "+id));
    }

    @PostMapping("/assign")
    @Operation(summary = "to assign user a staff role with services and his/her expertise from admin's user management ui")
    public ResponseEntity<ApiResponse<?>> assignStaffRole(
            @RequestBody StaffAssignRequest request
    ) {
        staffManagementService.assignStaffRole(request);
        return ResponseEntity.ok(ApiResponse.ok("Role assigned successfully"));
    }

    @PostMapping("/{id}/working-hours")
    @Operation(summary = "to add working hour of each day")
    public ResponseEntity<ApiResponse<?>> setWorkingHours(
            @ValidId @PathVariable Long id,
            @RequestBody List<WorkingHoursRequest> requests
    ) {
        staffManagementService.setWorkingHours(id, requests);
        return ResponseEntity.ok(ApiResponse.ok("Working hour set successfully"));
    }

    @PostMapping("/{id}/leave")
    @Operation(summary = "to add staff leave after approval")
    public ResponseEntity<ApiResponse<?>> addStaffLeave(
            @ValidId @PathVariable Long id,
            @RequestBody StaffLeaveRequest request
    ) {
        staffManagementService.addStaffLeave(id, request);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}/leave/{leaveId}")
    @Operation(summary = "to remove staff leave")
    public ResponseEntity<ApiResponse<?>> removeStaffLeave(
            @ValidId @PathVariable Long id,
            @ValidId @PathVariable Long leaveId
    ) {
        staffManagementService.removeStaffLeave(id, leaveId);
        return ResponseEntity.ok(ApiResponse.ok("Leave removed successfully"));
    }

    @PostMapping("/{id}/services")
    @Operation(summary = "to assign services to staff")
    public ResponseEntity<ApiResponse<?>> assignServicesToStaff(
            @ValidId @PathVariable Long id,
            @RequestBody List<Long> serviceIds
    ) {
        staffManagementService.assignServicesToStaff(id, serviceIds);
        return ResponseEntity.ok(ApiResponse.ok("Service assigned to staff "+id+" sucessfully"));
    }

    @DeleteMapping("/{id}/services/{serviceId}")
    @Operation(summary = "to remove services assigned to staff")
    public ResponseEntity<ApiResponse<?>> removeServiceFromStaff(
            @ValidId @PathVariable Long id,
            @ValidId @PathVariable Long serviceId
    ) {
        staffManagementService.removeServiceFromStaff(id, serviceId);
        return ResponseEntity.ok(ApiResponse.ok("Service assignment removed from staff"));
    }
}
