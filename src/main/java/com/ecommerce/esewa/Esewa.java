package com.ecommerce.esewa;

import com.ecommerce.model.payment.PaymentMethod;
import com.ecommerce.model.payment.PaymentModel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Esewa {

    private PaymentMethod paymentMethod=PaymentMethod.ESEWA;
    private BigDecimal amount;
    private BigDecimal taxAmt;
    private BigDecimal productServiceCharge;
    private BigDecimal productDeliveryCharge;

    //for response
    private String transaction_code;
    private String status;
    private String total_amount;
    private String transaction_uuid;
    private String product_code;
    private String signed_field_names;
    private String signature;

}
