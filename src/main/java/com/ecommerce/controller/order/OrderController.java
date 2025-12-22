package com.ecommerce.controller.order;

import com.ecommerce.dto.request.product.BuyProductRequest;
import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.order.OrderResponse;
import com.ecommerce.dto.response.order.UserOrderResponse;
import com.ecommerce.exception.ApplicationException;
import com.ecommerce.model.user.UserPrincipal;
import com.ecommerce.service.order.OrderService;
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
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    @PostMapping("/buy-product")
    @Operation(summary = "end point that handle buy now button click, only buying one product")
    public ResponseEntity<ApiResponse<?>> buyProductNow(
            @Valid BuyProductRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser
    ){
        if(currentUser == null){
            throw new ApplicationException("Please login to continue!", "NOT_LOGGED_IN", HttpStatus.UNAUTHORIZED);
        }

        String message = orderService.buyProductNow(request);
        return ResponseEntity.ok(ApiResponse.ok(message));
    }

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
    public ResponseEntity<ApiResponse<?>> getDetailOfProduct(
            @ValidId @PathVariable Long orderId,
            @AuthenticationPrincipal UserPrincipal currentUser
    ){
        if(currentUser == null){
            throw new ApplicationException("Please login to continue!", "NOT_LOGGED_IN", HttpStatus.UNAUTHORIZED);
        }
        UserOrderResponse response = orderService.getDetailsOfOrder(orderId);
        return ResponseEntity.ok(ApiResponse.ok(response, "Detail of order: "+orderId));

    }




}
