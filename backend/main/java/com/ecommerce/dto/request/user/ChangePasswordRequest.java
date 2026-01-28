package com.ecommerce.dto.request.user;

import com.ecommerce.validation.ValidPassword;

public record ChangePasswordRequest(
        @ValidPassword
        String oldPassword,
        @ValidPassword
        String newPassword,
        @ValidPassword
        String reNewPassword
){
}
