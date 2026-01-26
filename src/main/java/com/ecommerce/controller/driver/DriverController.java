package com.ecommerce.controller.driver;

import com.ecommerce.dto.request.order.OrderCompletionRequest;
import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.order.AssignedDeliveryResponse;
import com.ecommerce.dto.response.user.DriverDashboardResponse;
import com.ecommerce.model.user.Role;
import com.ecommerce.model.user.UserPrincipal;
import com.ecommerce.service.driver.DriverService;
import com.ecommerce.validation.ValidId;
import com.ecommerce.validation.ValidUsername;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Validated
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/driver")
public class DriverController {

    private final DriverService driverService;

    @GetMapping("/profile")
    @Operation(summary = "to fetch driver info from driver dashboard")
    public ResponseEntity<ApiResponse<DriverDashboardResponse>> getDriverInfo(
            @AuthenticationPrincipal UserPrincipal currentUser
    ){
        if(currentUser == null || currentUser.getUser().getRole() != Role.ROLE_DRIVER){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Unauthorized user!", "USER_UNAUTHORIZED"));
        }
        DriverDashboardResponse response = driverService.getDriverInfo(currentUser.getUser());
        return ResponseEntity.ok(ApiResponse.ok(response, "Driver info fetched successfully"));
    }

    @GetMapping("/assigned-deliveries/{driverId}")
    @Operation(summary = "to fetch list of assigned deliveries from driver profile")
    public ResponseEntity<ApiResponse<List<AssignedDeliveryResponse>>> getAssignedDelivery(
            @Valid @PathVariable Long driverId
    ){
        List<AssignedDeliveryResponse> deliveryAddresses = driverService.getAssignedDelivery(driverId);
        return ResponseEntity.ok(ApiResponse.ok(deliveryAddresses, "Address list fetched successfully"));
    }

    @PostMapping("/delivery/start/{username}")
    @Operation(summary = "when driver click start button to start delivery")
    public ResponseEntity<ApiResponse<?>> startDelivery(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @ValidUsername @PathVariable String username,
            @ValidId @RequestParam Long orderId
    ){
        if(currentUser == null || currentUser.getUser().getRole() != Role.ROLE_DRIVER){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Unauthorized user!", "USER_UNAUTHORIZED"));
        }
        driverService.startDeliveryOf(currentUser.getUser(), username, orderId);
        return ResponseEntity.ok(ApiResponse.ok("Started delivery of user: "+username));
    }

    @PostMapping("/delivery/complete")
    @Operation(summary = "when driver click start button to start delivery")
    public ResponseEntity<ApiResponse<?>> completeDelivery(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody OrderCompletionRequest request
    ){
        if(currentUser == null || currentUser.getUser().getRole() != Role.ROLE_DRIVER){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Unauthorized user!", "USER_UNAUTHORIZED"));
        }
        driverService.completeDeliveryOf(currentUser.getUser(), request);
        return ResponseEntity.ok(ApiResponse.ok("Completed delivery of user: "+request.username()));
    }

    @PostMapping("/delivery/complete-all")
    @Operation(summary = "when driver click back to store so that removing everything from redis")
    public ResponseEntity<ApiResponse<?>> completAllDelivery(
            @AuthenticationPrincipal UserPrincipal currentUser
    ){
        if(currentUser == null || currentUser.getUser().getRole() != Role.ROLE_DRIVER){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Unauthorized user!", "USER_UNAUTHORIZED"));
        }
        driverService.completeAllDelivery(currentUser.getUser());
        return ResponseEntity.ok(ApiResponse.ok("Completed all orders"));
    }

}
