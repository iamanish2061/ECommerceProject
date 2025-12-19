package com.ecommerce.service.auth;

import com.ecommerce.dto.request.auth.LoginRequest;
import com.ecommerce.dto.request.auth.SignupRequest;
import com.ecommerce.dto.request.email.EmailSenderRequest;
import com.ecommerce.dto.response.auth.AuthResponse;
import com.ecommerce.exception.ApplicationException;
import com.ecommerce.mapper.AuthMapper;
import com.ecommerce.model.user.UserModel;
import com.ecommerce.model.user.UserPrincipal;
import com.ecommerce.redis.RedisService;
import com.ecommerce.repository.user.UserRepository;
import com.ecommerce.service.email.EmailService;
import com.ecommerce.service.jwt.JwtService;
import com.ecommerce.utils.CookieUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.apache.commons.codec.digest.DigestUtils;
import org.mapstruct.factory.Mappers;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class AuthService {

    @Value("${jwt.accessExpiration}")
    private Long accessTokenExpiration;

    private final RedisService redisService;
    private final EmailService emailService;
    private final UserRepository userRepo;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final BCryptPasswordEncoder encoder= new BCryptPasswordEncoder(12);

    private final AuthMapper authMapper;

    public boolean doesUserNameExist(String username) {
        return userRepo.existsByUsername(username);
    }


    public boolean doesEmailExist(String email) {
        return userRepo.existsByEmail(email);
    }


    public boolean sendOtpCode(String email) {
        Integer otpCode = new Random().nextInt(900000) +100000;
        redisService.setCode(email, otpCode.toString(), 600L);
        String subject = "Verifying Email";
        String emailBody = "Your otp code is: "+otpCode+". Please do not share with anyone! If you find this irrelevant, please ignore it!";
        return emailService.sendEmail(new EmailSenderRequest(email, subject, emailBody));
    }


    public boolean verifyOtpCode(String email, String code) {
        String generatedCode = redisService.getCode(email);
        return generatedCode != null && generatedCode.equals(code);
    }


    @Transactional
    public AuthResponse register(SignupRequest request, HttpServletResponse httpResponse) throws ApplicationException {
        userRepo.findByUsername(request.username())
                .ifPresent(u -> {throw new ApplicationException("Username is taken!", "USERNAME_EXISTS", HttpStatus.CONFLICT);});

        userRepo.findByEmail(request.email())
                .ifPresent(u -> { throw new ApplicationException("Email already exists!", "EMAIL_EXISTS", HttpStatus.CONFLICT); });

        if(!verifyOtpCode(request.email(), request.code()))
            throw new ApplicationException("Invalid OTP code!", "INVALID_OTP_CODE", HttpStatus.BAD_REQUEST);
        if(!request.password().equals(request.rePassword()))
            throw new ApplicationException("Password do not match!", "PASSWORD_MISMATCH", HttpStatus.BAD_REQUEST);
        redisService.deleteCode(request.email());
        UserModel user = UserModel.builder()
                .fullName(request.fullname().trim())
                .username(request.username().trim())
                .password(encoder.encode(request.password().trim()))
                .email(request.email().trim())
                .createdAt(LocalDateTime.now())
                .tokenValidAfter(Instant.EPOCH)
                .build();
        UserModel savedUser = userRepo.save(user);
        String accessToken = jwtService.generateAccessToken(new UserPrincipal(savedUser));
        String refreshToken = jwtService.generateRefreshToken(new UserPrincipal(savedUser));
        savedUser.setRefreshToken(DigestUtils.sha256Hex(refreshToken));
        userRepo.save(savedUser);
        CookieUtils.setRefreshTokenCookie(refreshToken, httpResponse);
        return authMapper.mapEntityToResponse(savedUser, accessToken, accessTokenExpiration);
    }


    @Transactional
    public AuthResponse login(
            LoginRequest request, HttpServletResponse httpServletResponse
    )throws ApplicationException{
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.username(), request.password()));
        if (!authentication.isAuthenticated()){
            throw new ApplicationException("Invalid Credentials!", "INVALID_CREDENTIALS", HttpStatus.BAD_REQUEST);
        }
        UserModel dbUser = userRepo.findByUsername(request.username())
                .orElseThrow(()->new ApplicationException("Username not found!", "USERNAME_NOT_FOUND", HttpStatus.NOT_FOUND));
        // Generate tokens
        String accessToken = jwtService.generateAccessToken(new UserPrincipal(dbUser));
        String refreshToken = jwtService.generateRefreshToken(new UserPrincipal(dbUser));
        dbUser.setRefreshToken(DigestUtils.sha256Hex(refreshToken));
        dbUser.setTokenValidAfter(Instant.EPOCH);
        userRepo.save(dbUser);
        CookieUtils.setRefreshTokenCookie(refreshToken, httpServletResponse);
        return authMapper.mapEntityToResponse(dbUser, accessToken, accessTokenExpiration);
    }


    @Transactional
    public AuthResponse refreshToken(
            HttpServletRequest request, HttpServletResponse httpServletResponse
    ) throws ApplicationException{
        String refreshToken = CookieUtils.getRefreshTokenFromCookie(request)
                .orElseThrow(() -> new ApplicationException("Refresh token missing", "REFRESH_TOKEN_MISSING", HttpStatus.BAD_REQUEST));
        // Validate & extract user email from refresh token
        String email = jwtService.extractUsername(refreshToken);
        UserModel user = userRepo.findByUsername(email)
                .orElseThrow(() -> new ApplicationException("User not found", "NOT_FOUND", HttpStatus.NOT_FOUND));
        // Verify stored hash matches this refresh token
        if (!DigestUtils.sha256Hex(refreshToken).equals(user.getRefreshToken())) {
            throw new ApplicationException("Invalid refresh token", "INVALID_REFRESH_TOKEN", HttpStatus.BAD_REQUEST);
        }
        // Check if token is expired
        if (jwtService.isTokenExpired(refreshToken)) {
            user.setRefreshToken(null);
            userRepo.save(user);
            throw new ApplicationException("Refresh token expired", "REFRESH_TOKEN_EXPIRED", HttpStatus.BAD_REQUEST);
        }
        // Generate NEW access + refresh tokens (rotation!)
        String newAccessToken = jwtService.generateAccessToken(new UserPrincipal(user));
        String newRefreshToken = jwtService.generateRefreshToken(new UserPrincipal(user));
        // Save new hashed refresh token (old one invalidated)
        user.setRefreshToken(DigestUtils.sha256Hex(newRefreshToken));
        userRepo.save(user);
        // Set new refresh token in HttpOnly cookie
        CookieUtils.setRefreshTokenCookie(newRefreshToken, httpServletResponse);
        return authMapper.mapEntityToResponse(user, newAccessToken, accessTokenExpiration);
    }


    public void logout(Authentication auth, HttpServletResponse httpServletResponse) {
        if (auth != null && auth.getPrincipal() instanceof UserPrincipal principal) {
            UserModel user = principal.getUser();
            user.setRefreshToken(null);
            user.setTokenValidAfter(Instant.now());
            userRepo.save(user);
        }
        // Clear cookie
        CookieUtils.clearRefreshTokenCookie(httpServletResponse);
        // clear Spring Security context
        SecurityContextHolder.clearContext();
    }

}
