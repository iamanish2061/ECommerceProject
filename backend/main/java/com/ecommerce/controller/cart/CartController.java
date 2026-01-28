package com.ecommerce.controller.cart;

import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.cart.CartResponse;
import com.ecommerce.model.user.UserPrincipal;
import com.ecommerce.service.cart.CartService;
import com.ecommerce.validation.ValidId;
import com.ecommerce.validation.ValidQuantity;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Validated
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/cart")
public class CartController {

    private final CartService cartService;
    private final String cartErrorMessage = "Please login to add items to cart";
    private final String cartErrorCode = "NOT_LOGGED_IN";

    @PutMapping("/add-to-cart/{productId}")
    @Operation(summary = "endpoint for adding product to cart")
    public ResponseEntity<ApiResponse<String>> addToCart(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @ValidId
            @PathVariable Long productId,
            @ValidQuantity
            @RequestParam(defaultValue = "1") int quantity
    ) {
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error(cartErrorMessage, cartErrorCode));
        }

        String msg = cartService.addToCart(currentUser.getUser().getId(), productId, quantity);
        return ResponseEntity.ok(ApiResponse.ok(msg));
    }

    @GetMapping("/count")
    @Operation(summary = "endpoint for getting total number of cart items")
    public ResponseEntity<ApiResponse<?>> getTotalCartCount(
            @AuthenticationPrincipal UserPrincipal currentUser
    ){
        if(currentUser == null){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error(cartErrorMessage, cartErrorCode));
        }
        Long totalItem = cartService.getCartCount(currentUser.getUser().getId());
        return ResponseEntity.ok(ApiResponse.ok(Map.of("totalCartItems", totalItem), "Fetched successfully"));
    }

    @GetMapping()
    @Operation(summary = "endpoint for getting all cart items")
    public ResponseEntity<ApiResponse<List<CartResponse>>> getCartItems(
            @AuthenticationPrincipal UserPrincipal currentUser
    ){
        if(currentUser == null){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error(cartErrorMessage, cartErrorCode));
        }
        List<CartResponse> cartItems = cartService.getCartItems(currentUser.getUser().getId());
        return ResponseEntity.ok(ApiResponse.ok(
                cartItems, "Cart item fetched successfully"));
    }

    @PutMapping("/{productId}")
    @Operation(summary = "endpoint for updating cart items from cart page")
    public ResponseEntity<ApiResponse<String>> updateCart(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @ValidId @PathVariable Long productId,
            @ValidQuantity @RequestParam int quantity
    ){
        if(currentUser == null){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error(cartErrorMessage, cartErrorCode));
        }
        String msg = cartService.updateCart(currentUser.getUser().getId(), productId, quantity);
        return ResponseEntity.ok(ApiResponse.ok(msg));
    }

    @DeleteMapping("/{productId}")
    @Operation(summary = "endpoint for deleting cart item from cart page")
    public ResponseEntity<ApiResponse<String>> deleteFromCart(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @ValidId @PathVariable Long productId
    ){
        if(currentUser == null){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error(cartErrorMessage, cartErrorCode));
        }
        String msg = cartService.deleteFromCart(currentUser.getUser().getId(), productId);
        return ResponseEntity.ok(ApiResponse.ok(msg));
    }

    @DeleteMapping("/clear")
    @Operation(summary = "clearing cart")
    public ResponseEntity<ApiResponse<?>> clearCart(
            @AuthenticationPrincipal UserPrincipal currentUser
    ){
        if(currentUser == null){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error(cartErrorMessage, cartErrorCode));
        }
        String msg = cartService.clearCart(currentUser.getUser().getId());
        return ResponseEntity.ok(ApiResponse.ok(msg));
    }

}
