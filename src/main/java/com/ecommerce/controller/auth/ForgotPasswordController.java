package com.ecommerce.controller.auth;

import com.ecommerce.dto.request.auth.UpdatePasswordRequest;
import com.ecommerce.dto.request.auth.VerifyOtpCodeFromUsernameRequest;
import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.auth.AuthResponse;
import com.ecommerce.exception.ApplicationException;
import com.ecommerce.service.auth.AuthService;
import com.ecommerce.service.auth.ForgotPasswordService;
import com.ecommerce.validation.ValidUsername;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RequiredArgsConstructor
@RestController
@Validated
@RequestMapping("/api/auth")
public class ForgotPasswordController {

    private final AuthService authService;
    private final ForgotPasswordService forgotPasswordService;

//    when user tries to recover password using username, this endpoint checks if the username exists or not
//    get request with url?username=data
    @GetMapping("/username-exists")
    public ResponseEntity<ApiResponse<String>> checkUsernameExists (
            @ValidUsername @RequestParam String username
    )throws ApplicationException {
        if(!authService.doesUserNameExist(username)){
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Username not found!", "USER_NOT_FOUND"));
        }
        String maskedEmail = forgotPasswordService.findMaskedEmailByUsername(username);
        return ResponseEntity.ok(ApiResponse.ok(maskedEmail, "Username is valid!"));
    }

//    this endpoint is triggered after username exists and if user click send code to the masked email we send them
//    get request with url?username=data
    @GetMapping("/send-otp-code-to-recover")
    public ResponseEntity<ApiResponse<String>> sendCodeForForgotPassword(
            @ValidUsername @RequestParam String username
    ) throws ApplicationException {
        String email = forgotPasswordService.findEmailByUsername(username);
        if(!authService.sendOtpCode(email)) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).
                    body(ApiResponse.error("Failed to send Code", "FAILED_TO_SEND_CODE"));
        }
        return ResponseEntity.ok(ApiResponse.ok("Code sent successfully"));
    }

//    after user enters the otpcode, they click next or proceed button
//    then we need to verify the otpcode from username and email
//    post method with body username and code : see VerifyOtpWithUsernameRequest
    @PostMapping("/verify-otp-code-from-username")
    public ResponseEntity<ApiResponse<String>> verifyOtpCode(
            @Valid @RequestBody VerifyOtpCodeFromUsernameRequest request
    ){
        String email = forgotPasswordService.findEmailByUsername(request.username());
        if(authService.verifyOtpCode(email, request.code())){
            return ResponseEntity.ok(ApiResponse.ok("OTP verified."));
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("Invalid OTP code.", "INVALID_CODE"));
    }

//    after verifying, the user is given option to reset password or to continue without resetting
//    do you want to reset password now? yes ... no
//    this end point is for no (when user continue without resetting password)
//    data sending same as above
    @PostMapping("/continue-without-password-reset")
    public ResponseEntity<ApiResponse<AuthResponse>> setTokenForUserContinuingWithoutResettingPassword(
            @Valid @RequestBody VerifyOtpCodeFromUsernameRequest request,
            HttpServletResponse httpServletResponse
    ) throws ApplicationException {
        AuthResponse authResponse = forgotPasswordService.setTokenForUserContinuingWithoutResettingPassword(request.username(), request.code(), httpServletResponse);
        return ResponseEntity.ok(ApiResponse.ok(authResponse, "Token set successfully"));
    }

//    if user resets password
//    data sending post + request body : see UpdatePasswordRequest
    @PutMapping("/update-password")
    public ResponseEntity<ApiResponse<AuthResponse>> updatePassword(
            @Valid @RequestBody UpdatePasswordRequest request, HttpServletResponse httpServletResponse
    ) throws ApplicationException {
        AuthResponse apiResponse = forgotPasswordService.updatePassword(request, httpServletResponse);
        return ResponseEntity.ok(ApiResponse.ok(apiResponse, "Password Updated successfully."));
    }


}
