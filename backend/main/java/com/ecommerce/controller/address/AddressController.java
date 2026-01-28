package com.ecommerce.controller.address;

import com.ecommerce.controller.BaseController;
import com.ecommerce.dto.request.address.AddAddressRequest;
import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.address.AddressWithDeliveryChargeResponse;
import com.ecommerce.dto.response.address.DetailedAddress;
import com.ecommerce.model.address.AddressType;
import com.ecommerce.model.user.UserPrincipal;
import com.ecommerce.service.address.AddressService;
import com.ecommerce.validation.ValidId;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/address")
@RequiredArgsConstructor
@Validated
public class AddressController extends BaseController {

    private final AddressService addressService;

    @GetMapping("/type/{addressType}")
    @Operation(summary = "to get address of user (home and work) if exists")
    public ResponseEntity<ApiResponse<AddressWithDeliveryChargeResponse>> getAddressOfUser(
        @AuthenticationPrincipal UserPrincipal currentUser,
        @PathVariable AddressType addressType
    ){
        if(currentUser == null){
            return unauthorized();
        }
        AddressWithDeliveryChargeResponse address = addressService.getAddressOfType(currentUser.getUser(), addressType);
        if(address!= null)
            return success(address, "Fetched address successfully");
        return success("Address not found");
    }

    @GetMapping("/fetch-type/{addressType}")
    @Operation(summary = "to get address of user (home and work) to display in user profile")
    public ResponseEntity<ApiResponse<DetailedAddress>> getAddressOfUserForProfile(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable AddressType addressType
    ){
        if(currentUser == null){
            return unauthorized();
        }
        DetailedAddress address = addressService.getAddressForProfileOfType(currentUser.getUser(), addressType);
        if(address!= null)
            return success(address, "Fetched address successfully");
        return success("Address not found");
    }

    @PostMapping("/add")
    @Operation(summary = "to add home or work address")
    public ResponseEntity<ApiResponse<DetailedAddress>> addAddress(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody AddAddressRequest request
    ){
        if(currentUser == null){
            return unauthorized();
        }
        DetailedAddress address =addressService.addAddress(currentUser.getUser().getId(), request);
        return success(address,"Address added successfully");
    }

    @PutMapping("/update/{addressId}")
    @Operation(summary = "to update home or work address")
    public ResponseEntity<ApiResponse<DetailedAddress>> updateAddress(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @ValidId @PathVariable Long addressId,
            @Valid @RequestBody AddAddressRequest request
    ){
        if(currentUser == null){
            return unauthorized();
        }
        DetailedAddress address =addressService.updateAddress(currentUser.getUser().getId(), addressId, request);
        return success(address,"Address updated successfully");
    }


}
