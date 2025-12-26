package com.ecommerce.controller.order;

import com.ecommerce.dto.request.address.DeliveryChargeRequest;
import com.ecommerce.dto.request.order.PlaceOrderRequest;
import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.order.OrderResponse;
import com.ecommerce.dto.response.order.UserOrderResponse;
import com.ecommerce.exception.ApplicationException;
import com.ecommerce.model.user.UserPrincipal;
import com.ecommerce.service.order.OrderService;
import com.ecommerce.service.order.RouteService;
import com.ecommerce.validation.ValidId;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Validated
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final RouteService routeService;
    private final OrderService orderService;
    private final String notLoggedInMessage = "Please login to add items to cart";
    private final String notLoggedInErrorCode = "NOT_LOGGED_IN";


    @GetMapping("/")
    @Operation(summary = "get all orders of that user to list them in their profile")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getAllProducts(
            @AuthenticationPrincipal UserPrincipal currentUser
    ){
        if(currentUser == null){
            throw new ApplicationException("Please login to continue!", "NOT_LOGGED_IN", HttpStatus.UNAUTHORIZED);
        }
        List<OrderResponse> response = orderService.getAllOrdersOf(currentUser.getUser());
        return ResponseEntity.ok(ApiResponse.ok(response, "All orders of user: "+currentUser.getUser().getId()));

    }

    @GetMapping("/{orderId}")
    @Operation(summary = "get detail of order that user clicks from the list of orders")
    public ResponseEntity<ApiResponse<UserOrderResponse>> getDetailOfProduct(
            @ValidId @PathVariable Long orderId,
            @AuthenticationPrincipal UserPrincipal currentUser
    ){
        if(currentUser == null){
            throw new ApplicationException("Please login to continue!", "NOT_LOGGED_IN", HttpStatus.UNAUTHORIZED);
        }
        UserOrderResponse response = orderService.getDetailsOfOrder(orderId);
        return ResponseEntity.ok(ApiResponse.ok(response, "Detail of order: "+orderId));
    }

    @PostMapping("/calculate-delivery-charge")
    @Operation(summary = "to save address in redis temporary and return delivery charge : triggered when user click confirm address checkbox")
    public ResponseEntity<ApiResponse<Map<String, BigDecimal>>> getDeliveryCharge(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody DeliveryChargeRequest request
    ){
        if(currentUser == null){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error(notLoggedInMessage, notLoggedInErrorCode));
        }
        BigDecimal deliveryCharge = routeService.calculateDeliveryCharge(request.latitude(), request.longitude());
        return ResponseEntity.ok(ApiResponse.ok(Map.of("deliveryCharge", deliveryCharge), "Returned delivery charge"));
    }

    @PostMapping("/single-product-checkout/{productId}")
    @Operation(summary = "checkout api for single product")
    public ResponseEntity<ApiResponse<?>> checkoutSingleProduct(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @ValidId @PathVariable Long productId,
            @Valid @RequestBody PlaceOrderRequest request
    ){
        if(currentUser == null){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error(notLoggedInMessage, notLoggedInErrorCode));
        }
        orderService.checkoutSingleProduct(currentUser.getUser(), productId, request);

        return ResponseEntity.ok(ApiResponse.ok("Order placed successfully"));
    }

    @PostMapping("/checkout")
    @Operation(summary = "checkout api for cart products")
    public ResponseEntity<ApiResponse<?>> checkout(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody PlaceOrderRequest request
    ){
        if(currentUser == null){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error(notLoggedInMessage, notLoggedInErrorCode));
        }
        orderService.checkout(currentUser.getUser(), request);
        return ResponseEntity.ok(ApiResponse.ok("Order placed successfully"));
    }


}
