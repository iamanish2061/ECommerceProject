package com.ecommerce.controller.admin;

import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.user.DetailedUser;
import com.ecommerce.dto.response.user.DetailedUserResponse;
import com.ecommerce.dto.response.user.DriverInfoResponse;
import com.ecommerce.model.user.Role;
import com.ecommerce.model.user.UserStatus;
import com.ecommerce.service.admin.AdminUserService;
import com.ecommerce.validation.ValidId;
import io.swagger.v3.oas.annotations.Operation;
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
    @Operation(summary = "to fetch all users")
    public ResponseEntity<ApiResponse<List<DetailedUser>>> getAllUsers(){
        List<DetailedUser> users = userService.getAllUsers();
        return ResponseEntity.ok(ApiResponse.ok(users, "Fetched info of all users"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "to fetch info of one user")
    public ResponseEntity<ApiResponse<DetailedUserResponse>> getSingleUser(
            @ValidId @PathVariable Long id
    ){
        DetailedUserResponse response = userService.getSingleUserInfo(id);
        return ResponseEntity.ok(ApiResponse.ok(response, "User detail fetched successfully"));
    }

    @PutMapping("/role/{id}")
    @Operation(summary = "to update role of the user")
    public ResponseEntity<ApiResponse<Map<String, Role>>> updateRole(
            @ValidId @PathVariable Long id,
            @RequestParam Role role
    ){
        userService.updateRole(id, role);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("role", role), "Role updated successfully"));
    }

    @PutMapping("/status/{id}")
    @Operation(summary = "to update status of the user")
    public ResponseEntity<ApiResponse<Map<String, UserStatus>>> updateStatus(
            @ValidId @PathVariable Long id,
            @NotBlank(message = "Status is required!")
            @RequestParam UserStatus status
    ){
        userService.updateStatus(id, status);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("status", status),"Status updated successfully"));
    }

    @GetMapping("/driver-info")
    @Operation(summary = "to get the info of driver")
    public ResponseEntity<ApiResponse<DriverInfoResponse>> getDriverInformation(
            @ValidId @RequestParam Long id
    ){
        DriverInfoResponse response = userService.getDriverInformation(id);
        return ResponseEntity.ok(ApiResponse.ok(response, "Fetched driver info of: "+id));
    }

    @PostMapping("/assign-driver/{driverId}")
    @Operation(summary = "to assign delivery addresses to driver")
    public ResponseEntity<ApiResponse<?>> assignDeliveryToDriver(
            @PathVariable Long driverId
    ){
        userService.assignDeliveryToDriver(driverId);
        return ResponseEntity.ok(ApiResponse.ok("Assigned successfully"));
    }

}
