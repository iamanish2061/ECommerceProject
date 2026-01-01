package com.ecommerce.mapper.payment;

import com.ecommerce.dto.response.payment.PaymentResponse;
import com.ecommerce.esewa.Esewa;
import com.ecommerce.khalti.KhaltiCallbackDTO;
import com.ecommerce.model.payment.PaymentModel;
import com.ecommerce.model.payment.PaymentStatus;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.math.BigDecimal;

@Mapper(componentModel = "spring")
public interface PaymentMapper {

    @Mapping(source = "id", target = "paymentId")
    @Mapping(source = "amount", target = "totalAmount")
    PaymentResponse mapEntityToPaymentResponse(PaymentModel payment);

    @Mapping(source = "status", target = "paymentStatus", qualifiedByName = "setPaymentStatus")
    @Mapping(source = "total_amount", target = "amount", qualifiedByName = "setTotalAmount")
    @Mapping(source = "transaction_uuid", target = "transactionId")
    @Mapping(source = "paymentMethod", target = "paymentMethod", defaultExpression = "java(PaymentMethod.ESEWA)")
    PaymentModel mapEsewaToPaymentModel(Esewa esewa);

    // Convert string status to enum
    @Named("setPaymentStatus")
    default PaymentStatus setPaymentStatus(String status) {
        if (status == null) return PaymentStatus.PENDING; // default value
        try {
            return PaymentStatus.valueOf(status.toUpperCase()); // map string to enum
        } catch (IllegalArgumentException e) {
            return PaymentStatus.PENDING; // fallback
        }
    }

    // Convert string total_amount to BigDecimal
    @Named("setTotalAmount")
    default BigDecimal setTotalAmount(String totalAmount) {
        if (totalAmount == null || totalAmount.isBlank()) return BigDecimal.ZERO;
        String cleanedAmount = totalAmount.replace(",", "");
        return new BigDecimal(cleanedAmount);
    }


    @Mapping(source = "status", target = "paymentStatus", qualifiedByName = "setKhaltiPaymentStatus")
    @Mapping(source = "total_amount", target = "amount", qualifiedByName = "setKhaltiTotalAmount")
    @Mapping(source = "transaction_id", target = "transactionId")
    @Mapping(source = "paymentMethod", target = "paymentMethod", defaultExpression = "java(PaymentMethod.KHALTI)")
    PaymentModel mapKhaltiToPaymentModel(KhaltiCallbackDTO khalti);

    @Named("setKhaltiPaymentStatus")
    default PaymentStatus setKhaltiPaymentStatus(String status) {
        status = status.toUpperCase();
        if (status == null) return PaymentStatus.PENDING; // default value
        if(status.equals("COMPLETED")) return PaymentStatus.COMPLETE;
        try {
            return PaymentStatus.valueOf(status.toUpperCase()); // map string to enum
        } catch (IllegalArgumentException e) {
            return PaymentStatus.PENDING; // fallback
        }
    }

    // Convert string total_amount to BigDecimal
    @Named("setKhaltiTotalAmount")
    default BigDecimal setKhaltiTotalAmount(String totalAmount) {
        if (totalAmount == null || totalAmount.isBlank()) return BigDecimal.ZERO;
        String cleanedAmount = totalAmount.replace(",", "");
        return new BigDecimal(cleanedAmount).multiply(BigDecimal.valueOf(0.01));
    }


}
