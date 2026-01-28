package com.ecommerce.dto.request.auth;

import com.ecommerce.validation.ValidPassword;
import com.ecommerce.validation.ValidUsername;

public record LoginRequest(
        @ValidUsername
        String username,

        @ValidPassword
        String password
) {}
