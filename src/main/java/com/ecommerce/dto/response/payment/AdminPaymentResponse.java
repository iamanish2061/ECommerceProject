package com.ecommerce.dto.response.payment;

public record AdminPaymentResponse (
        PaymentResponse response,
        String username,
        Long orderId,
        Long appointmentId
){}
