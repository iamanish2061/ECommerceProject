package com.ecommerce.controller.auth;

import com.ecommerce.controller.BaseController;
import com.ecommerce.dto.request.auth.UpdatePasswordRequest;
import com.ecommerce.dto.request.auth.VerifyOtpCodeFromUsernameRequest;
import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.auth.AuthResponse;
import com.ecommerce.service.auth.AuthService;
import com.ecommerce.service.auth.ForgotPasswordService;
import com.ecommerce.validation.ValidUsername;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "Forgot Password APIs", description = "Forgot related sabai xa")
public class ForgotPasswordController extends BaseController {

    private final AuthService authService;
    private final ForgotPasswordService forgotPasswordService;

//    when user tries to recover password using username, this endpoint checks if the username exists or not
//    get request with url?username=data
    @GetMapping("/username-exists")
    public ResponseEntity<ApiResponse<String>> checkUsernameExists (
            @ValidUsername @RequestParam String username
    ){
        if(!authService.doesUserNameExist(username)){
            return error("Username not found!", "USER_NOT_FOUND", HttpStatus.NOT_FOUND);
        }
        String maskedEmail = forgotPasswordService.findMaskedEmailByUsername(username);
        return success(maskedEmail, "Username is valid!");
    }

//    this endpoint is triggered after username exists and if user click send code to the masked email we send them
//    get request with url?username=data
    @GetMapping("/send-otp-code-to-recover")
    public ResponseEntity<ApiResponse<Void>> sendCodeForForgotPassword(
            @ValidUsername @RequestParam String username
    ){
        String email = forgotPasswordService.findEmailByUsername(username);
        if(!authService.sendOtpCode(email)) {
            return error("Failed to send Code", "FAILED_TO_SEND_CODE", HttpStatus.INTERNAL_SERVER_ERROR);
        }
        return success("Code sent successfully");
    }

//    after user enters the otpcode, they click next or proceed button
//    then we need to verify the otpcode from username and email
//    post method with body username and code : see VerifyOtpWithUsernameRequest
    @PostMapping("/verify-otp-code-from-username")
    public ResponseEntity<ApiResponse<Void>> verifyOtpCode(
            @Valid @RequestBody VerifyOtpCodeFromUsernameRequest request
    ){
        String email = forgotPasswordService.findEmailByUsername(request.username());
        if(authService.verifyOtpCode(email, request.code())){
            return success("OTP verified.");
        }
        return error("Invalid OTP code.", "INVALID_CODE", HttpStatus.BAD_REQUEST);
    }

//    after verifying, the user is given option to reset password or to continue without resetting
//    do you want to reset password now? yes ... no
//    this end point is for no (when user continue without resetting password)
//    data sending same as above
    @PostMapping("/continue-without-password-reset")
    public ResponseEntity<ApiResponse<AuthResponse>> setTokenForUserContinuingWithoutResettingPassword(
            @Valid @RequestBody VerifyOtpCodeFromUsernameRequest request,
            HttpServletResponse httpServletResponse
    ){
        AuthResponse authResponse = forgotPasswordService.setTokenForUserContinuingWithoutResettingPassword(request.username(), request.code(), httpServletResponse);
        return success(authResponse, "Token set successfully");
    }

//    if user resets password
//    data sending post + request body : see UpdatePasswordRequest
    @PutMapping("/update-password")
    public ResponseEntity<ApiResponse<AuthResponse>> updatePassword(
            @Valid @RequestBody UpdatePasswordRequest request, HttpServletResponse httpServletResponse
    ){
        AuthResponse apiResponse = forgotPasswordService.updatePassword(request, httpServletResponse);
        return success(apiResponse, "Password Updated successfully.");
    }


}
