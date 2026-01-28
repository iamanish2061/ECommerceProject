package com.ecommerce.service.auth;

import com.ecommerce.dto.request.auth.UpdatePasswordRequest;
import com.ecommerce.dto.response.auth.AuthResponse;
import com.ecommerce.exception.ApplicationException;
import com.ecommerce.mapper.AuthMapper;
import com.ecommerce.model.user.UserModel;
import com.ecommerce.model.user.UserPrincipal;
import com.ecommerce.redis.RedisService;
import com.ecommerce.repository.user.UserRepository;
import com.ecommerce.service.jwt.JwtService;
import com.ecommerce.utils.CookieUtils;
import com.ecommerce.utils.HelperClass;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.apache.commons.codec.digest.DigestUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ForgotPasswordService {

    @Value("${jwt.accessExpiration}")
    private Long accessTokenExpiration;

    private final AuthService authService;
    private final RedisService redisService;
    private final JwtService jwtService;
    private final UserRepository userRepo;
    private final BCryptPasswordEncoder encoder= new BCryptPasswordEncoder(12);

    private final AuthMapper authMapper;

    public String findEmailByUsername(String username) throws ApplicationException {
        String email = userRepo.findByUsername(username)
                .map(UserModel::getEmail)
                .orElse(null);
        if (email == null)
            throw new ApplicationException("Email not found", "EMAIL_NOT_FOUND", HttpStatus.NOT_FOUND);
        return email;
    }


    public String findMaskedEmailByUsername(String username) throws ApplicationException {
        return HelperClass.maskEmail(findEmailByUsername(username));
    }


    @Transactional
    public AuthResponse setTokenForUserContinuingWithoutResettingPassword(
            String username,
            String code,
            HttpServletResponse httpServletResponse
    ) throws ApplicationException {
        UserModel user = userRepo.findByUsername(username).orElse(null);
        if(user == null){
            throw new ApplicationException("User not found!", "USER_NOT_FOUND", HttpStatus.NOT_FOUND);
        }
        if(!authService.verifyOtpCode(user.getEmail(), code)){
            throw new ApplicationException("Invalid OTP code!", "INVALID_OTP_CODE", HttpStatus.BAD_REQUEST);
        }
        redisService.deleteCode(user.getEmail());
        String accessToken = jwtService.generateAccessToken(new UserPrincipal(user));
        String refreshToken = jwtService.generateRefreshToken(new UserPrincipal(user));
        user.setRefreshToken(DigestUtils.sha256Hex(refreshToken));
        userRepo.save(user);
        CookieUtils.setRefreshTokenCookie(refreshToken, httpServletResponse);
        return authMapper.mapEntityToResponse(user, accessToken, accessTokenExpiration);
    }


    @Transactional
    public AuthResponse updatePassword(
            UpdatePasswordRequest request, HttpServletResponse httpServletResponse
    ) throws ApplicationException{
        UserModel user= userRepo.findByUsername(request.username()).orElse(null);
        if(user == null)
            throw new ApplicationException("User not found!", "USER_NOT_FOUND", HttpStatus.NOT_FOUND);
        if(!authService.verifyOtpCode(user.getEmail(), request.code())){
            throw new ApplicationException("Invalid OTP code!", "INVALID_OTP_CODE", HttpStatus.BAD_REQUEST);
        }
        if(!request.password().equals(request.rePassword()))
            throw new ApplicationException("Password do not match!", "PASSWORD_MISMATCH", HttpStatus.BAD_REQUEST);
        redisService.deleteCode(user.getEmail());
        user.setUpdatedAt(LocalDateTime.now());
        user.setPassword(encoder.encode(request.password()));
        UserModel savedUser = userRepo.save(user);
        String accessToken = jwtService.generateAccessToken(new UserPrincipal(savedUser));
        String refreshToken = jwtService.generateRefreshToken(new UserPrincipal(savedUser));
        savedUser.setRefreshToken(DigestUtils.sha256Hex(refreshToken));
        userRepo.save(savedUser);
        CookieUtils.setRefreshTokenCookie(refreshToken, httpServletResponse);
        return authMapper.mapEntityToResponse(savedUser, accessToken, accessTokenExpiration);
    }

}
