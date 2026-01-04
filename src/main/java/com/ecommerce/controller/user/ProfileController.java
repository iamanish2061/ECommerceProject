package com.ecommerce.controller.user;

import com.ecommerce.dto.request.user.ChangePasswordRequest;
import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.user.UserProfileResponse;
import com.ecommerce.model.user.UserPrincipal;
import com.ecommerce.service.user.ProfileService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

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

    @PutMapping("/change-photo")
    @Operation(summary = "to change photo")
    public ResponseEntity<ApiResponse<?>> changePhoto(
                @AuthenticationPrincipal UserPrincipal user,
                MultipartFile photo
    ){
        if(user == null){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error(profileErrorMessage, profileErrorCode));
        }
        profileService.changeProfilePicture(user.getUser().getId(), photo);
        return ResponseEntity.ok(ApiResponse.ok("Profile picture changed successfully"));
    }

}
