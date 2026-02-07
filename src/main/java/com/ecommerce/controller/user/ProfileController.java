package com.ecommerce.controller.user;

import com.ecommerce.controller.BaseController;
import com.ecommerce.dto.request.user.ChangePasswordRequest;
import com.ecommerce.dto.request.user.DriverRegisterRequest;
import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.user.UserProfileResponse;
import com.ecommerce.model.user.UserPrincipal;
import com.ecommerce.service.user.ProfileService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@Validated
@RequestMapping("/api/profile")
public class ProfileController extends BaseController {

    private final ProfileService profileService;

    @GetMapping("/get-details")
    @Operation(summary = "to fetch details along with address from profile.html")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getProfileDetails(
            @AuthenticationPrincipal UserPrincipal user
    ){
        if(user == null){
            return unauthorized();
        }
        UserProfileResponse response = profileService.getProfileDetails(user.getUser().getId());
        return success(response, "User details fetched");
    }


    @PostMapping("/change-password")
    @Operation(summary = "to change password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal UserPrincipal user,
            @Valid @RequestBody ChangePasswordRequest request
    ){
        if(user == null){
            return unauthorized();
        }
        profileService.changePassword(user.getUser().getId(), request);
        return success( "Password changed successfully");
    }


    @PutMapping(value = "/change-photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "to change photo")
    public ResponseEntity<ApiResponse<Map<String, String>>> changePhoto(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestParam("file") MultipartFile file
    ) {
        if(user == null){
            return unauthorized();
        }
        String profileUrl= profileService.changeProfilePicture(user.getUser(), file);
        return success(Map.of("profileUrl", profileUrl), "Profile picture changed successfully");
    }

    @GetMapping("/check-driver-status")
    @Operation(summary = "To check if the driver status is pending, verified or not applied to display the text in profile")
    public ResponseEntity<ApiResponse<String>> checkDriverStatus(
            @AuthenticationPrincipal UserPrincipal currentUser
    ){
        if(currentUser == null){
            return unauthorized();
        }
        String status = profileService.getDriverStatus(currentUser.getUser());
        return success(status, "Status fetched successfully");
    }


    @PostMapping(value = "/register-driver", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "To handle form of driver registration")
    public ResponseEntity<ApiResponse<Void>> registerDriver(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestPart("license") MultipartFile license,
            @Valid @RequestPart("driverRegisterRequest") DriverRegisterRequest driverRegisterRequest
    ){
        if(currentUser == null){
            return unauthorized();
        }
        profileService.registerDriver(currentUser.getUser(), license, driverRegisterRequest);
        return success("Registered successfully");
    }

}