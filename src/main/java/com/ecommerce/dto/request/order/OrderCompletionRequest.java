package com.ecommerce.dto.request.order;

import com.ecommerce.validation.ValidId;
import com.ecommerce.validation.ValidUsername;

public record OrderCompletionRequest(
        @ValidId
        Long orderId,
        @ValidUsername
        String username
) {
}
