package com.ecommerce.khalti;

import com.ecommerce.model.payment.PaymentMethod;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class KhaltiCallbackDTO {

    private PaymentMethod paymentMethod=PaymentMethod.KHALTI;
    private String pidx;
    private String transaction_id;
    private String tidx;
    private String txnId;
    private String amount;
    private String total_amount;
    private String mobile;
    private String status;
    private String purchase_order_id;
    private String purchase_order_name;

}
