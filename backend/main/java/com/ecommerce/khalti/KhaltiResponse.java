package com.ecommerce.khalti;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class KhaltiResponse {

    private String pidx;
    private String payment_url;
    private String expires_at;
    private String expires_in;

}
