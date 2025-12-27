package com.ecommerce.khalti;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Configuration
@ConfigurationProperties(prefix = "khalti")
public class KhaltiConfig {
    private String liveSecretKey;
    private String livePublicKey;
    private String verifyUrl;
    private String initialUrl;
    private String websiteUrl;
    private String callbackUrl;
}
