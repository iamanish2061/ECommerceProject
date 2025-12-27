package com.ecommerce.esewa;

import com.ecommerce.exception.ApplicationException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class EsewaService {

    private final ObjectMapper objectMapper;
    private final EsewaConfig config;

    public Esewa parseEsewaResponse(String encodedData) throws IOException {
        if (encodedData == null || encodedData.isBlank()) return null;

        byte[] decoded = Base64.getDecoder().decode(encodedData);
        Esewa response = objectMapper.readValue(decoded, Esewa.class);

        if (response.getTotal_amount() != null) {
            response.setTotal_amount(response.getTotal_amount().replace(",", ""));
        }
        return response;
    }

    public boolean validateResponse(Esewa response) {
        if (response==null) return false;
        boolean isValid = verifySignature(response);
        boolean paymentComplete = "COMPLETE".equalsIgnoreCase(response.getStatus());
        return isValid && paymentComplete;
    }

    //this method is used to generate unique transaction uuid each time its requested
    public String generateTransactionUuid() {
        return UUID.randomUUID().toString();
    }

    //this method is used to generate data required for generating signature (according to the requirement stated by esewa to generate signature)
    public String prepareDataForSignature(String totalAmount, String transactionUuid) {
        return String.format("total_amount=%s,transaction_uuid=%s,product_code=%s",totalAmount, transactionUuid, config.getMerchantId());
    }

    // used for generating signature based on given data
    public String getSignature(String data) {
        try {
            Mac sha256_HMAC = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(config.getSecretKey().getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            sha256_HMAC.init(secretKeySpec);
            byte[] hashBytes = sha256_HMAC.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hashBytes);
        } catch (Exception e) {
            throw new ApplicationException("Error generating signature", "ERROR_PROCESSING_IN_ESEWA_PAYMENT", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    //to verify signature sent from esewa
    //if response from esewa then verifying
    public boolean verifySignature(Esewa response) {
        try {
            if (response == null || response.getSigned_field_names() == null || response.getSignature() == null) {
                log.warn("Missing signed_field_names or signature");
                return false;
            }

            String[] fields = response.getSigned_field_names().split(",");
            StringBuilder signedData = new StringBuilder();
            for (int i = 0; i < fields.length; i++) {
                String key = fields[i];
                String value = getValueFromResponse(response, key);
                signedData.append(key).append("=").append(value);
                if (i < fields.length - 1) signedData.append(",");
            }
            String esewaGeneratedSignature = getSignature(signedData.toString());

            return (response.getSignature().equals(esewaGeneratedSignature));
        } catch (Exception e) {
            log.error("Signature verification failed: ",e);
            return false;
        }
    }

    public String getValueFromResponse(Esewa response, String fieldName) {
        switch (fieldName) {
            case "transaction_code": return response.getTransaction_code();
            case "status": return response.getStatus();
            case "total_amount": return response.getTotal_amount();
            case "transaction_uuid": return response.getTransaction_uuid();
            case "product_code": return response.getProduct_code();
            case "signed_field_names": return response.getSigned_field_names();
            default: return "";
        }
    }

}
