package com.ecommerce.controller.user;

import com.ecommerce.dto.request.user.ChangePasswordRequest;
import com.ecommerce.dto.request.user.DriverRegisterRequest;
import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.user.UserProfileResponse;
import com.ecommerce.model.user.UserPrincipal;
import com.ecommerce.service.user.ProfileService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
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
public class ProfileController {

    private static final String profileErrorMessage ="Please log in to continue!";
    private static final String profileErrorCode ="NOT_LOGGED_IN";

    private final ProfileService profileService;

    @GetMapping("/get-details")
    @Operation(summary = "to fetch details along with address from profile.html")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getProfileDetails(
            @AuthenticationPrincipal UserPrincipal user
    ){
        if(user == null){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error(profileErrorMessage, profileErrorCode));
        }
        UserProfileResponse response = profileService.getProfileDetails(user.getUser().getId());
        return ResponseEntity.ok(ApiResponse.ok(response, "User details fetched"));
    }


    @PostMapping("/change-password")
    @Operation(summary = "to change password")
    public ResponseEntity<ApiResponse<?>> changePassword(
            @AuthenticationPrincipal UserPrincipal user,
            @Valid @RequestBody ChangePasswordRequest request
    ){
        if(user == null){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error(profileErrorMessage, profileErrorCode));
        }
        profileService.changePassword(user.getUser().getId(), request);
        return ResponseEntity.ok(ApiResponse.ok( "Password changed successfully"));
    }


    @PutMapping(value = "/change-photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "to change photo")
    public ResponseEntity<ApiResponse<?>> changePhoto(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestParam("file") MultipartFile file
    ) {
        if(user == null){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error(profileErrorMessage, profileErrorCode));
        }
        String profileUrl= profileService.changeProfilePicture(user.getUser(), file);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("profileUrl", profileUrl), "Profile picture changed successfully"));
    }

    @GetMapping("/check-driver-status")
    @Operation(summary = "To check if the driver status is pending, verified or not applied to display the text in profile")
    public ResponseEntity<ApiResponse<?>> checkDriverStatus(
            @AuthenticationPrincipal UserPrincipal currentUser
    ){
        if(currentUser == null){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error(profileErrorMessage, profileErrorCode));
        }
        String status = profileService.getDriverStatus(currentUser.getUser());
        return ResponseEntity.ok(ApiResponse.ok(status, "Status fetched successfully"));
    }


    @PostMapping(value = "/register-driver", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "To handle form of driver registration")
    public ResponseEntity<ApiResponse<?>> registerDriver(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestPart("license") MultipartFile license,
            @Valid @RequestPart("driverRegisterRequest") DriverRegisterRequest driverRegisterRequest
    ){
        if(currentUser == null){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error(profileErrorMessage, profileErrorCode));
        }
        profileService.registerDriver(currentUser.getUser(), license, driverRegisterRequest);
        return ResponseEntity.ok(ApiResponse.ok("Registered successfully"));
    }

}