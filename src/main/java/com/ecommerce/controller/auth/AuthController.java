package com.ecommerce.controller.auth;

import com.ecommerce.dto.request.auth.LoginRequest;
import com.ecommerce.dto.request.auth.SignupRequest;
import com.ecommerce.dto.request.auth.VerifyOtpCodeRequest;
import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.auth.AuthResponse;
import com.ecommerce.exception.ApplicationException;
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
public class AuthController {

    private final AuthService authService;

//    end point for checking if username is available for registering
//    data to be sent through get request : url?username=data
    @Operation(summary = "check if entered username is available")
    @GetMapping("/username-availability")
    public ResponseEntity<ApiResponse<String>> checkUserNameAvailability(
            @ValidUsername @RequestParam String username
    ){
        if(authService.doesUserNameExist(username)){
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ApiResponse.error("Username is taken.", "USERNAME_EXISTS"));
        }
        return ResponseEntity.ok(ApiResponse.ok("Username is available."));
    }

//    end point for checking if email is unique for registering and send otp
//    data to be sent through get request : url?email=data
    @GetMapping("/send-otp-code")
    public ResponseEntity<ApiResponse<String>> sendOtpCode(
            @ValidEmail @RequestParam String email
    ){
        if(authService.doesEmailExist(email)){
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ApiResponse.error("Email already exists", "EMAIL_EXISTS"));
        }
        if(!authService.sendOtpCode(email)) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).
                    body(ApiResponse.error("Failed to send Code", "FAILED_TO_SEND_CODE"));
        }
        return ResponseEntity.ok(ApiResponse.ok("Code sent successfully"));
    }

//    end point for verifying otp code
//    post request : parameters should be sent in body {email=...., code=...}
    @PostMapping("/verify-otp-code")
    public ResponseEntity<ApiResponse<String>> verifyOtpCode(
            @Valid @RequestBody VerifyOtpCodeRequest request
    ){
        if(authService.verifyOtpCode(request.email(), request.code())){
            return ResponseEntity.ok(ApiResponse.ok("OTP verified."));
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("Invalid OTP code.", "INVALID_CODE"));
    }

//    end point for signing up
//    post method + request body : see request body in SignupRequest
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody SignupRequest request, HttpServletResponse httpResponse
    ) throws ApplicationException {
        AuthResponse authResponse = authService.register(request, httpResponse);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(authResponse, "Account created successfully"));
    }

//    end point for logging in
//    post method + request body : see LoginRequest
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request, HttpServletResponse httpResponse
    )throws ApplicationException {
        AuthResponse authResponse = authService.login(request, httpResponse);
        return ResponseEntity.ok(ApiResponse.ok(authResponse, "Logged in successfully!"));
    }

//    generating refresh token
//    redirect to this api if the error is token expired
//    post request with no body
    @PostMapping("/refresh-token")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(
            HttpServletRequest request, HttpServletResponse httpServletResponse
    )throws ApplicationException {
        AuthResponse authResponse = authService.refreshToken(request, httpServletResponse);
        return ResponseEntity.ok(
                ApiResponse.ok(authResponse, "Token refreshed successfully!")
        );
    }

// hit this end point when user logs out of the system
//    post request with no body
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<?>> logout(
            HttpServletResponse httpServletResponse, Authentication authentication
    ) {
        authService.logout(authentication, httpServletResponse);
        return ResponseEntity.ok(
                ApiResponse.ok("Logged out successfully"));
    }

}
