package com.ecommerce.controller.driver;

import com.ecommerce.controller.BaseController;
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
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Validated
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/driver")
public class DriverController extends BaseController {

    private final DriverService driverService;

    @GetMapping("/profile")
    @Operation(summary = "to fetch driver info from driver dashboard")
    public ResponseEntity<ApiResponse<DriverDashboardResponse>> getDriverInfo(
            @AuthenticationPrincipal UserPrincipal currentUser
    ){
        if(currentUser == null || currentUser.getUser().getRole() != Role.ROLE_DRIVER){
            return unauthorized();
        }
        DriverDashboardResponse response = driverService.getDriverInfo(currentUser.getUser());
        return success(response, "Driver info fetched successfully");
    }

    @GetMapping("/assigned-deliveries/{driverId}")
    @Operation(summary = "to fetch list of assigned deliveries from driver profile")
    public ResponseEntity<ApiResponse<List<AssignedDeliveryResponse>>> getAssignedDelivery(
            @Valid @PathVariable Long driverId
    ){
        List<AssignedDeliveryResponse> deliveryAddresses = driverService.getAssignedDelivery(driverId);
        return success(deliveryAddresses, "Address list fetched successfully");
    }

    @PostMapping("/delivery/start/{username}")
    @Operation(summary = "when driver click start button to start delivery")
    public ResponseEntity<ApiResponse<Void>> startDelivery(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @ValidUsername @PathVariable String username,
            @ValidId @RequestParam Long orderId
    ){
        if(currentUser == null || currentUser.getUser().getRole() != Role.ROLE_DRIVER){
            return unauthorized();
        }
        driverService.startDeliveryOf(currentUser.getUser(), username, orderId);
        return success("Started delivery of user: "+username);
    }

    @PostMapping("/delivery/complete")
    @Operation(summary = "when driver click start button to start delivery")
    public ResponseEntity<ApiResponse<Void>> completeDelivery(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody OrderCompletionRequest request
    ){
        if(currentUser == null || currentUser.getUser().getRole() != Role.ROLE_DRIVER){
            return unauthorized();
        }
        driverService.completeDeliveryOf(currentUser.getUser(), request);
        return success("Completed delivery of user: "+request.username());
    }

    @PostMapping("/delivery/complete-all")
    @Operation(summary = "when driver click back to store so that removing everything from redis")
    public ResponseEntity<ApiResponse<Void>> completAllDelivery(
            @AuthenticationPrincipal UserPrincipal currentUser
    ){
        if(currentUser == null || currentUser.getUser().getRole() != Role.ROLE_DRIVER){
            return unauthorized();
        }
        driverService.completeAllDelivery(currentUser.getUser());
        return success("Completed all orders");
    }

}
