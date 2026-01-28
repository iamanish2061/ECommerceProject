package com.ecommerce.khalti;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class KhaltiRequest {

    private BigDecimal amount;
    private String purchase_order_id;
    private String purchase_order_name;

}
