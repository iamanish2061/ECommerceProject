package com.ecommerce.esewa;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix="esewa")
@Data @AllArgsConstructor @NoArgsConstructor
public class EsewaConfig {

    private static final Logger log = LoggerFactory.getLogger(EsewaConfig.class);
    private String merchantId;
    private String secretKey;
    private String paymentUrl;
    private String responseHandlingUrl;

}
