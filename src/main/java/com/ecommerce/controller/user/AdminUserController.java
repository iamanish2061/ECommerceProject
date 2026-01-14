package com.ecommerce.controller.user;

import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.user.*;
import com.ecommerce.exception.ApplicationException;
import com.ecommerce.model.user.Role;
import com.ecommerce.model.user.UserStatus;
import com.ecommerce.service.user.AdminUserService;
import com.ecommerce.validation.ValidId;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Validated
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {

    private final AdminUserService userService;

    @GetMapping()
    public ResponseEntity<ApiResponse<List<DetailedUser>>> getAllUsers(){
        //pagination
        List<DetailedUser> users = userService.getAllUsers();
        return ResponseEntity.ok(ApiResponse.ok(users, "Fetched info of all users"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DetailedUserResponse>> getSingleUser(
            @ValidId @PathVariable Long id
    )throws ApplicationException {
        DetailedUserResponse response = userService.getSingleUserInfo(id);
        return ResponseEntity.ok(ApiResponse.ok(response, "User detail fetched successfully"));
    }

    @PutMapping("/role/{id}")
    public ResponseEntity<ApiResponse<Map<String, Role>>> updateRole(
            @ValidId @PathVariable Long id,
            @RequestParam Role role
    )throws ApplicationException{
        userService.updateRole(id, role);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("role", role), "Role updated successfully"));
    }

    @PutMapping("/status/{id}")
    public ResponseEntity<ApiResponse<Map<String, UserStatus>>> updateStatus(
            @ValidId @PathVariable Long id,
            @NotBlank(message = "Status is required!")
            @RequestParam UserStatus status
    )throws ApplicationException{
        userService.updateStatus(id, status);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("status", status),"Status updated successfully"));
    }

    @GetMapping("/driver-info")
    public ResponseEntity<ApiResponse<DriverInfoResponse>> getDriverInformation(
            @ValidId @RequestParam Long id
    ){
        DriverInfoResponse response = userService.getDriverInformation(id);
        return ResponseEntity.ok(ApiResponse.ok(response, "Fetched driver info of: "+id));
    }

    @GetMapping("/staff-info")
    public ResponseEntity<ApiResponse<StaffInfoResponse>> getStaffInformation(
            @ValidId @RequestParam Long id
    ){
        StaffInfoResponse response = userService.getStaffInformation(id);
        return ResponseEntity.ok(ApiResponse.ok(response, "Fetched staff info of: "+id));
    }

    @PostMapping("/assign-driver/{driverId}")
    public ResponseEntity<ApiResponse<?>> assignDeliveryToDriver(
            @PathVariable Long driverId
    ){
        userService.assignDeliveryToDriver(driverId);
        return ResponseEntity.ok(ApiResponse.ok("Assigned successfully"));
    }

}
