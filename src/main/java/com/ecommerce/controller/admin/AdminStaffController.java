package com.ecommerce.controller.admin;

import com.ecommerce.controller.BaseController;
import com.ecommerce.dto.request.staff.StaffAssignRequest;
import com.ecommerce.dto.request.staff.WorkingHoursRequest;
import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.staff.NameAndIdOfStaffResponse;
import com.ecommerce.dto.response.staff.StaffDetailResponse;
import com.ecommerce.dto.response.staff.StaffListResponse;
import com.ecommerce.model.user.StaffRole;
import com.ecommerce.service.staff.StaffManagementService;
import com.ecommerce.validation.ValidId;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
@RestController
@RequestMapping("/api/admin/staff")
@RequiredArgsConstructor
@Validated
public class AdminStaffController extends BaseController {

    private final StaffManagementService staffManagementService;

//    used in specific-user-html to add user a expert role
    @GetMapping("/expert-list")
    @Operation(summary = "to get the list of expert fields")
    public ResponseEntity<ApiResponse<List<StaffRole>>> getExpertFieldList(){
        return success(staffManagementService.getExpertFieldList(), "Fetched the list of expert field");
    }

    //    used in service.html of admin to add staff as checkbox
    @GetMapping("/name-and-id")
    @Operation(summary = "to fetch name and id of staff for dropdown in adding staff to specific service form")
    public ResponseEntity<ApiResponse<List<NameAndIdOfStaffResponse>>> getNameAndIdOfStaff(){
        return success(staffManagementService.getNameAndIdOfStaff(), "Fetched name and id of staff");
    }

    @PostMapping("/assign")
    @Operation(summary = "to assign user a staff role with services and his/her expertise from admin's user management ui")
    public ResponseEntity<ApiResponse<Void>> assignStaffRole(
            @RequestBody StaffAssignRequest request
    ) {
        staffManagementService.assignStaffRole(request);
        return success("Role assigned successfully");
    }

//    for staff page
    @GetMapping
    @Operation(summary = "to fetch all staff to list in admin ui")
    public ResponseEntity<ApiResponse<List<StaffListResponse>>> getAllStaff() {
        return success(staffManagementService.getAllStaff(), "Fetched staff successfully");
    }

    @GetMapping("/{id}")
    @Operation(summary = "to get detail of staff")
    public ResponseEntity<ApiResponse<StaffDetailResponse>> getStaffDetail(
            @ValidId @PathVariable Long id
    ) {
        return success(staffManagementService.getStaffDetailforAdmin(id), "Fetched detail of staff: "+id);
    }

    @PostMapping("/{id}/working-hours")
    @Operation(summary = "to add working hour of each day")
    public ResponseEntity<ApiResponse<Void>> setWorkingHours(
            @ValidId @PathVariable Long id,
            @RequestBody List<WorkingHoursRequest> requests
    ) {
        staffManagementService.setWorkingHours(id, requests);
        return success("Working hour set successfully");
    }

    @PostMapping("/{id}/services")
    @Operation(summary = "to assign services to staff")
    public ResponseEntity<ApiResponse<Void>> assignServicesToStaff(
            @ValidId @PathVariable Long id,
            @RequestBody List<Long> serviceIds
    ) {
        staffManagementService.assignServicesToStaff(id, serviceIds);
        return success("Service assigned to staff "+id+" successfully");
    }

    @DeleteMapping("/{id}/services/{serviceId}")
    @Operation(summary = "to remove services assigned to staff")
    public ResponseEntity<ApiResponse<Void>> removeServiceFromStaff(
            @ValidId @PathVariable Long id,
            @ValidId @PathVariable Long serviceId
    ) {
        staffManagementService.removeServiceFromStaff(id, serviceId);
        return success("Service assignment removed from staff");
    }

}
