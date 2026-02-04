package com.ecommerce.controller.order;

import com.ecommerce.controller.BaseController;
import com.ecommerce.dto.request.address.DeliveryChargeRequest;
import com.ecommerce.dto.request.order.PlaceOrderRequest;
import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.order.OrderResponse;
import com.ecommerce.dto.response.order.UserOrderResponse;
import com.ecommerce.dto.response.payment.PaymentRedirectResponse;
import com.ecommerce.model.user.UserPrincipal;
import com.ecommerce.service.order.OrderService;
import com.ecommerce.service.order.RouteService;
import com.ecommerce.validation.ValidId;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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
public class OrderController extends BaseController {

    private final RouteService routeService;
    private final OrderService orderService;

    @GetMapping("/")
    @Operation(summary = "get all orders of that user to list them in their order page")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getAllProducts(
            @AuthenticationPrincipal UserPrincipal currentUser
    ){
        if(currentUser == null){
            return unauthorized();
        }
        List<OrderResponse> response = orderService.getAllOrdersOf(currentUser.getUser());
        return success(response, "All orders of user: "+currentUser.getUser().getId());

    }

    @GetMapping("/for-profile")
    @Operation(summary = "to list on profile page")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getRecentThreeOrders(
            @AuthenticationPrincipal UserPrincipal currentUser
    ){
        if(currentUser == null){
            return unauthorized();
        }
        List<OrderResponse> response = orderService.getRecentOrdersOf(currentUser.getUser());
        return success(response, "Recent orders of user: "+currentUser.getUser().getId());

    }

    @GetMapping("/{orderId}")
    @Operation(summary = "get detail of order that user clicks from the list of orders")
    public ResponseEntity<ApiResponse<UserOrderResponse>> getDetailOfOrder(
            @ValidId @PathVariable Long orderId,
            @AuthenticationPrincipal UserPrincipal currentUser
    ){
        if(currentUser == null){
            return unauthorized();
        }
        UserOrderResponse response = orderService.getDetailsOfOrder(orderId);
        return success(response, "Detail of order: "+orderId);
    }

    @PutMapping("/cancel/{orderId}")
    @Operation(summary = "to cancel the order by the user")
    public ResponseEntity<ApiResponse<Void>> cancelOrder(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long orderId
    ){
        if(currentUser == null){
            return unauthorized();
        }
        orderService.cancelOrder(currentUser.getUser(), orderId);
        return success("Order cancelled successfully!");
    }

    @PostMapping("/calculate-delivery-charge")
    @Operation(summary = "to save address in redis temporary and return delivery charge : triggered when user click confirm address checkbox")
    public ResponseEntity<ApiResponse<Map<String, BigDecimal>>> getDeliveryCharge(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody DeliveryChargeRequest request
    ){
        if(currentUser == null){
            return unauthorized();
        }
        BigDecimal deliveryCharge = routeService.calculateDeliveryCharge(request.latitude(), request.longitude());
        return success(Map.of("deliveryCharge", deliveryCharge), "Returned delivery charge");
    }

    @PostMapping("/single-product-checkout/{productId}")
    @Operation(summary = "checkout api for single product")
    public ResponseEntity<ApiResponse<PaymentRedirectResponse>> checkoutSingleProduct(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @ValidId @PathVariable Long productId,
            @Valid @RequestBody PlaceOrderRequest request
    ){
        if(currentUser == null){
            return unauthorized();
        }
        PaymentRedirectResponse paymentRedirectResponse= orderService.checkoutSingleProduct(currentUser.getUser(), productId, request);
        return success(paymentRedirectResponse, "Ready to redirect");
    }

    @PostMapping("/checkout")
    @Operation(summary = "checkout api for cart products")
    public ResponseEntity<ApiResponse<PaymentRedirectResponse>> checkout(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody PlaceOrderRequest request
    ){
        if(currentUser == null){
            return unauthorized();
        }
        PaymentRedirectResponse paymentRedirectResponse= orderService.checkout(currentUser.getUser(), request);
        return success(paymentRedirectResponse, "Ready to redirect");
    }


}
