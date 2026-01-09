package com.ecommerce.controller.order;

import com.ecommerce.dto.request.order.UpdateOrderStatusRequest;
import com.ecommerce.dto.request.product.SellProductRequests;
import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.order.OrderResponse;
import com.ecommerce.dto.response.order.SingleOrderResponse;
import com.ecommerce.model.user.UserPrincipal;
import com.ecommerce.service.order.AdminOrderService;
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

@Validated
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/admin/orders")
public class AdminOrderController {

    private final AdminOrderService adminOrderService;

    //    selling products instore
    @PostMapping("/sell-products")
    @Operation(summary = "end point for selling product when customer buys from store itself")
    public ResponseEntity<ApiResponse<?>> sellProducts(
            @Valid @RequestBody List<SellProductRequests> requests,
            @AuthenticationPrincipal UserPrincipal currentUser
    ){
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Admin not logged in", "ADMIN_NOT_LOGGED_IN"));
        }

        String message = adminOrderService.sellProducts(requests, currentUser.getUser());
        return ResponseEntity.ok(ApiResponse.ok(message));
    }

//    for returning all orders
    @GetMapping()
    @Operation(summary = "Fetching all orders in descending order to display in admin side")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getAllOrders(){
        List<OrderResponse> orderResponse = adminOrderService.getAllOrders();
        return ResponseEntity.ok(
                ApiResponse.ok(orderResponse, "All orders fetched")
        );
    }

    //    getting status list like pending , shipped, delivered , cancelled
    @GetMapping("/status-list")
    @Operation(summary = "for fetching all possible status type of order")
    public ResponseEntity<ApiResponse<?>> getStatusList(){
        List<String> statusList = adminOrderService.getStatusList();
        return ResponseEntity.ok(
                ApiResponse.ok(statusList, "Fetched status list")
        );
    }

    //    getting all order of specific user
    @GetMapping("/user/{userId}")
    @Operation(summary = "can be removed if the filter can be done from frontend only - for fetching order of particular user")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getOrdersOfSpeificUser(
            @ValidId @PathVariable Long userId
    ){
        List<OrderResponse> orderResponses = adminOrderService.getOrderOfUser(userId);
        return ResponseEntity.ok(
                ApiResponse.ok(orderResponses, "Order fetched of user: "+userId)
        );
    }

    //    detail of particular order
    @GetMapping("/{orderId}")
    @Operation(summary = "to fetch detailed information of any order")
    public ResponseEntity<ApiResponse<SingleOrderResponse>> getDetailsOfOrder(
            @ValidId @PathVariable("orderId") Long orderId
    ){
        SingleOrderResponse orderResponse = adminOrderService.getDetailOfOrder(orderId);
        return ResponseEntity.ok(
                ApiResponse.ok(orderResponse, "Details fetched of order: "+orderId)
        );
    }

//    updating status of order
    @PutMapping("/{orderId}/status")
    @Operation(summary = "to change the status of order")
    public ResponseEntity<ApiResponse<?>> updateStatus(
            @ValidId @PathVariable Long orderId,
            @Valid @RequestBody UpdateOrderStatusRequest request
    ){
        adminOrderService.updateOrderStatus(orderId, request.status());
        return ResponseEntity.ok(
                ApiResponse.ok("Order status updated")
        );
    }



}
