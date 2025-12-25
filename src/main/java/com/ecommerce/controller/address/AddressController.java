package com.ecommerce.controller.address;

import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.address.AddressResponse;
import com.ecommerce.model.user.AddressType;
import com.ecommerce.model.user.UserPrincipal;
import com.ecommerce.service.address.AddressService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/address")
public class AddressController {

    private final AddressService addressService;
    private final String notLoggedInMessage = "Please login to add items to cart";
    private final String notLoggedInErrorCode = "NOT_LOGGED_IN";

    @GetMapping("/type/{addressType}")
    @Operation(summary = "to get address of user (home and work) if exists")
    public ResponseEntity<ApiResponse<AddressResponse>> getAddressOfUser(
        @AuthenticationPrincipal UserPrincipal currentUser,
        @PathVariable AddressType addressType
    ){
        if(currentUser!= null){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error(notLoggedInMessage, notLoggedInErrorCode));
        }
        AddressResponse address = addressService.getAddressOfType(addressType);
        if(address!= null)
            return ResponseEntity.ok(ApiResponse.ok(address, "Fetched address successfully"));
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.ok("Address not found"));
    }


}
