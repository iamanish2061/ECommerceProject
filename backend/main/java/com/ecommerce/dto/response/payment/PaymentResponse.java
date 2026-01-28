package com.ecommerce.dto.response.payment;

import com.ecommerce.model.payment.PaymentMethod;
import com.ecommerce.model.payment.PaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PaymentResponse(
        Long paymentId,
        BigDecimal totalAmount,
        String transactionId,
        PaymentMethod paymentMethod,
        PaymentStatus paymentStatus,
        LocalDateTime paymentDate,
        String errorCode
) {}
