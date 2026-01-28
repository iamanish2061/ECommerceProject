package com.ecommerce.controller.admin;

import com.ecommerce.controller.BaseController;
import com.ecommerce.dto.request.order.UpdateOrderStatusRequest;
import com.ecommerce.dto.request.product.SellProductRequests;
import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.order.OrderResponse;
import com.ecommerce.dto.response.order.SingleOrderResponse;
import com.ecommerce.dto.response.order.UserOrderResponse;
import com.ecommerce.model.user.UserPrincipal;
import com.ecommerce.service.admin.AdminOrderService;
import com.ecommerce.validation.ValidId;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Validated
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/admin/orders")
public class AdminOrderController extends BaseController {

    private final AdminOrderService adminOrderService;

    //    selling products instore
    @PostMapping("/sell-products")
    @Operation(summary = "end point for selling product when customer buys from store itself")
    public ResponseEntity<ApiResponse<Void>> sellProducts(
            @Valid @RequestBody List<SellProductRequests> requests,
            @AuthenticationPrincipal UserPrincipal currentUser
    ){
        if (currentUser == null) {
            return unauthorized();
        }
        String message = adminOrderService.sellProducts(requests, currentUser.getUser());
        return success(message);
    }

//    for returning all orders
    @GetMapping()
    @Operation(summary = "Fetching all orders in descending order to display in admin side")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getAllOrders(){
        return success(adminOrderService.getAllOrders(), "All orders fetched");
    }

    //    getting status list like pending , shipped, delivered , cancelled
    @GetMapping("/status-list")
    @Operation(summary = "for fetching all possible status type of order")
    public ResponseEntity<ApiResponse<List<String>>> getStatusList(){
        return success(adminOrderService.getStatusList(), "Fetched status list");
    }

    //    detail of particular order
    @GetMapping("/{orderId}")
    @Operation(summary = "to fetch detailed information of any order")
    public ResponseEntity<ApiResponse<SingleOrderResponse>> getDetailsOfOrder(
            @ValidId @PathVariable("orderId") Long orderId
    ){
        return success(adminOrderService.getDetailOfOrder(orderId), "Details fetched of order: "+orderId);
    }

//    updating status of order
    @PutMapping("/{orderId}/status")
    @Operation(summary = "to change the status of order")
    public ResponseEntity<ApiResponse<Void>> updateStatus(
            @ValidId @PathVariable Long orderId,
            @Valid @RequestBody UpdateOrderStatusRequest request
    ){
        adminOrderService.updateOrderStatus(orderId, request.status());
        return success("Order status updated");
    }

//    ----- for admin - manage-specific-user.html page to list orders there -----
    @GetMapping("/user/{userId}")
    @Operation(summary = "to fetch list of orders in user page of admin")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getOrdersOf(
            @ValidId @PathVariable Long userId
    ) {
        return success(adminOrderService.getOrdersOf(userId), "Fetched order list of user: "+userId);
    }

    @GetMapping("/{orderId}/user-profile")
    @Operation(summary = "get detail of order that admin clicks from the list of orders in user profile")
    public ResponseEntity<ApiResponse<UserOrderResponse>> getDetailOfOrder(
            @ValidId @PathVariable Long orderId
    ){
        return success(adminOrderService.getDetailsOfOrderForUserProfile(orderId), "Detail of order: "+orderId);
    }

}
