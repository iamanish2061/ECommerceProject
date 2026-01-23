package com.ecommerce.controller.staff;

import com.ecommerce.dto.request.staff.StaffLeaveRequest;
import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.appointment.AppointmentResponse;
import com.ecommerce.dto.response.staff.LeaveSummaryResponse;
import com.ecommerce.dto.response.staff.StaffResponse;
import com.ecommerce.model.user.UserPrincipal;
import com.ecommerce.service.staff.StaffManagementService;
import com.ecommerce.validation.ValidId;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/staff")
@Validated
@RequiredArgsConstructor
public class StaffController {

    private final StaffManagementService staffService;

    @GetMapping()
    @Operation(summary = "to fetch details for staff ui")
    public ResponseEntity<ApiResponse<StaffResponse>> getStaffDetails(
            @AuthenticationPrincipal UserPrincipal currentUser
    ){
        if(currentUser == null){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Please login to continue!", "NOT_LOGGED_IN"));
        }
        return ResponseEntity.ok(ApiResponse.ok(staffService.getStaffDetailForStaff(currentUser.getUser().getId()), "fetched staff details"));
    }

    @GetMapping("/upcoming-appointments")
    @Operation(summary = "to fetch upcoming appointments of the staff")
    public ResponseEntity<ApiResponse<List<AppointmentResponse>>> getUpcomingAppointments(
            @AuthenticationPrincipal UserPrincipal currentUser
    ){
        if(currentUser == null){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Please login to continue!", "NOT_LOGGED_IN"));
        }
        return ResponseEntity.ok(ApiResponse.ok(staffService.getUpcomingAppointments(currentUser.getUser().getId()), "fetched upcoming appointments of staff: "+currentUser.getUser().getId()));
    }

    @GetMapping("/appointment-history")
    @Operation(summary = "to fetch appointment history of the staff")
    public ResponseEntity<ApiResponse<List<AppointmentResponse>>> getAppointmentHistory(
            @AuthenticationPrincipal UserPrincipal currentUser
    ){
        if(currentUser == null){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Please login to continue!", "NOT_LOGGED_IN"));
        }
        return ResponseEntity.ok(ApiResponse.ok(staffService.getAppointmentHistory(currentUser.getUser().getId()), "fetched appointment history of staff: "+currentUser.getUser().getId()));
    }

    @GetMapping("/leaves")
    @Operation(summary = "to fetch leave of the staff")
    public ResponseEntity<ApiResponse<List<LeaveSummaryResponse>>> getLeaveOfStaff(
            @AuthenticationPrincipal UserPrincipal currentUser
    ){
        if(currentUser == null){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Please login to continue!", "NOT_LOGGED_IN"));
        }
        return ResponseEntity.ok(ApiResponse.ok(staffService.getLeaveListOfStaff(currentUser.getUser().getId()), "Fetched leave list of staff"));
    }

    @PostMapping("/request-leave")
    @Operation(summary = "to submit leave request by staff")
    public ResponseEntity<ApiResponse<?>> requestLeave(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid StaffLeaveRequest request
    ){
        if(currentUser == null){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Please login to continue!", "NOT_LOGGED_IN"));
        }
        staffService.requestStaffLeave(currentUser.getUser(), request);
        return ResponseEntity.ok(ApiResponse.ok("Leave request submitted"));
    }

    @PutMapping("/cancel-leave/{leaveId}")
    @Operation(summary = "to cancel the applied application by staff")
    public ResponseEntity<ApiResponse<?>> cancelLeave(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @ValidId @PathVariable Long leaveId
    ){
        if(currentUser == null){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Please login to continue!", "NOT_LOGGED_IN"));
        }
        staffService.cancelStaffLeave(currentUser.getUser().getId(), leaveId);
        return ResponseEntity.ok(ApiResponse.ok("Leave application cancelled"));
    }


}
