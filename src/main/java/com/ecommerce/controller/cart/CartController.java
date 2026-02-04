package com.ecommerce.controller.cart;

import com.ecommerce.controller.BaseController;
import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.cart.CartResponse;
import com.ecommerce.model.user.UserPrincipal;
import com.ecommerce.service.cart.CartService;
import com.ecommerce.validation.ValidId;
import com.ecommerce.validation.ValidQuantity;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
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
public class CartController extends BaseController {

    private final CartService cartService;

    @PutMapping("/add-to-cart/{productId}")
    @Operation(summary = "endpoint for adding product to cart")
    public ResponseEntity<ApiResponse<Void>> addToCart(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @ValidId
            @PathVariable Long productId,
            @ValidQuantity
            @RequestParam(defaultValue = "1") int quantity
    ) {
        if (currentUser == null) {
            return unauthorized();
        }
        String msg = cartService.addToCart(currentUser.getUser().getId(), productId, quantity);
        return success(msg);
    }

    @GetMapping("/count")
    @Operation(summary = "endpoint for getting total number of cart items")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getTotalCartCount(
            @AuthenticationPrincipal UserPrincipal currentUser
    ){
        if(currentUser == null){
            return unauthorized();
        }
        Long totalItem = cartService.getCartCount(currentUser.getUser().getId());
        return success(Map.of("totalCartItems", totalItem), "Fetched successfully");
    }

    @GetMapping()
    @Operation(summary = "endpoint for getting all cart items")
    public ResponseEntity<ApiResponse<List<CartResponse>>> getCartItems(
            @AuthenticationPrincipal UserPrincipal currentUser
    ){
        if(currentUser == null){
            return unauthorized();
        }
        List<CartResponse> cartItems = cartService.getCartItems(currentUser.getUser().getId());
        return success(cartItems, "Cart item fetched successfully");
    }

    @PutMapping("/{productId}")
    @Operation(summary = "endpoint for updating cart items from cart page")
    public ResponseEntity<ApiResponse<Void>> updateCart(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @ValidId @PathVariable Long productId,
            @ValidQuantity @RequestParam int quantity
    ){
        if(currentUser == null){
            return unauthorized();
        }
        String msg = cartService.updateCart(currentUser.getUser().getId(), productId, quantity);
        return success(msg);
    }

    @DeleteMapping("/{productId}")
    @Operation(summary = "endpoint for deleting cart item from cart page")
    public ResponseEntity<ApiResponse<Void>> deleteFromCart(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @ValidId @PathVariable Long productId
    ){
        if(currentUser == null){
            return unauthorized();
        }
        String msg = cartService.deleteFromCart(currentUser.getUser().getId(), productId);
        return success(msg);
    }

    @DeleteMapping("/clear")
    @Operation(summary = "clearing cart")
    public ResponseEntity<ApiResponse<Void>> clearCart(
            @AuthenticationPrincipal UserPrincipal currentUser
    ){
        if(currentUser == null){
            return unauthorized();
        }
        String msg = cartService.clearCart(currentUser.getUser().getId());
        return success(msg);
    }

}
