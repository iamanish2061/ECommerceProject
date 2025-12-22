package com.ecommerce.mapper.payment;

import com.ecommerce.dto.response.payment.PaymentResponse;
import com.ecommerce.model.payment.PaymentModel;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface PaymentMapper {

    @Mapping(source = "id", target = "paymentId")
    @Mapping(source = "amount", target = "totalAmount")
    PaymentResponse mapEntityToPaymentResponse(PaymentModel payment);

}
