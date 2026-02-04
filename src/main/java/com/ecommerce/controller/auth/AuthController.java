package com.ecommerce.controller.auth;

import com.ecommerce.controller.BaseController;
import com.ecommerce.dto.request.auth.LoginRequest;
import com.ecommerce.dto.request.auth.SignupRequest;
import com.ecommerce.dto.request.auth.VerifyOtpCodeRequest;
import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.auth.AuthResponse;
import com.ecommerce.service.auth.AuthService;
import com.ecommerce.validation.ValidEmail;
import com.ecommerce.validation.ValidUsername;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@Validated
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth")
@Tag(name = "Auth APIs")
public class AuthController extends BaseController {

    private final AuthService authService;

//    end point for checking if username is available for registering
//    data to be sent through get request : url?username=data
    @Operation(summary = "check if entered username is available")
    @GetMapping("/username-availability")
    public ResponseEntity<ApiResponse<Void>> checkUserNameAvailability(
            @ValidUsername @RequestParam String username
    ){
        if(authService.doesUserNameExist(username)){
            return error("Username is taken!", "USERNAME_EXISTS", HttpStatus.CONFLICT);
        }
        return success("Username is available.");
    }

//    end point for checking if email is unique for registering and send otp
//    data to be sent through get request : url?email=data
    @Operation(summary = "send code to entered email by checking if email is unique and does not exist in db")
    @GetMapping("/send-otp-code")
    public ResponseEntity<ApiResponse<Void>> sendOtpCode(
            @ValidEmail @RequestParam String email
    ){
        if(authService.doesEmailExist(email)){
            return error("Email already exists!", "EMAIL_EXISTS", HttpStatus.CONFLICT);
        }
        if(!authService.sendOtpCode(email)) {
            return error("Failed to send Code", "FAILED_TO_SEND_CODE", HttpStatus.INTERNAL_SERVER_ERROR);
        }
        return success("Code sent successfully");
    }

//    end point for verifying otp code
//    post request : parameters should be sent in body {email=...., code=...}
@Operation(summary = "for verifying the code entered by user: (send email also)")
    @PostMapping("/verify-otp-code")
    public ResponseEntity<ApiResponse<Void>> verifyOtpCode(
            @Valid @RequestBody VerifyOtpCodeRequest request
    ){
        if(authService.verifyOtpCode(request.email(), request.code())){
            return success("OTP verified.");
        }
        return error("Invalid OTP code.", "INVALID_CODE", HttpStatus.BAD_REQUEST);
    }

//    end point for signing up
//    post method + request body : see request body in SignupRequest
    @Operation(summary = "final step for register, it saves user to db")
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody SignupRequest request, HttpServletResponse httpResponse
    ){
        AuthResponse authResponse = authService.register(request, httpResponse);
        return success(authResponse, "Account created successfully", HttpStatus.CREATED);
    }

//    end point for logging in
//    post method + request body : see LoginRequest
    @Operation(summary = "end point for logging in")
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request, HttpServletResponse httpResponse
    ){
        AuthResponse authResponse = authService.login(request, httpResponse);
        return success(authResponse, "Logged in successfully!");
    }

//    generating refresh token
//    redirect to this api if the error is token expired
//    post request with no body
    @Operation(summary = "if user's access token is expired but refresh token is not then this endpoint helps to generate new access token")
    @PostMapping("/refresh-token")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(
            HttpServletRequest request, HttpServletResponse httpServletResponse
    ){
        AuthResponse authResponse = authService.refreshToken(request, httpServletResponse);
        return success(authResponse, "Token refreshed successfully!");
    }

// hit this end point when user logs out of the system
//    post request with no body
    @Operation(summary = "end point for logging out")
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            HttpServletResponse httpServletResponse, Authentication authentication
    ) {
        authService.logout(authentication, httpServletResponse);
        return success("Logged out successfully");
    }

}
