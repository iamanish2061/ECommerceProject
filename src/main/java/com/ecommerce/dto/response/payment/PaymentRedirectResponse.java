package com.ecommerce.dto.response.payment;

import com.ecommerce.esewa.Esewa;
import com.ecommerce.model.payment.PaymentMethod;

public record PaymentRedirectResponse(
        PaymentMethod method,
        String url,
        Esewa esewa
){
}
