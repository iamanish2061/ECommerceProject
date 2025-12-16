package com.ecommerce.dto.request.email;

import com.ecommerce.validation.ValidEmail;

public record EmailSenderRequest(
        @ValidEmail
        String to,
        String subject,
        String body
) {}
