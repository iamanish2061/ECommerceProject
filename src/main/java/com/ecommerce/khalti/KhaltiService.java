package com.ecommerce.khalti;

import com.ecommerce.mapper.payment.PaymentMapper;
import com.ecommerce.model.payment.PaymentModel;
import com.ecommerce.service.order.SuccessPaymentOrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class KhaltiService {

    private final KhaltiConfig config;
    private final RestTemplate restTemplate;
    private final SuccessPaymentOrderService successPaymentOrderService;
    private final PaymentMapper paymentMapper;

    public KhaltiResponse initiatePayment(KhaltiRequest khalti){
        // Request body as per stated by khalti
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("return_url", config.getCallbackUrl());
        requestBody.put("website_url", config.getWebsiteUrl());
        requestBody.put("amount", khalti.getAmount()); // amount in paisa (e.g., Rs 50 = 50*100)
        requestBody.put("purchase_order_id", khalti.getPurchase_order_id());
        requestBody.put("purchase_order_name", khalti.getPurchase_order_name());

        // Headers (we need to specify authorizatoin too)
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Key " + config.getLiveSecretKey());

        // Combining both of above
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        // Sending POST request to khalti and mapping the response to KhaltiResponse Class
        ResponseEntity<KhaltiResponse> response = restTemplate.exchange(config.getInitialUrl(), HttpMethod.POST, entity, KhaltiResponse.class);

        return response.getBody();
    }

    public boolean verifyPayment(KhaltiCallbackDTO response){
        PaymentModel payment = paymentMapper.mapKhaltiToPaymentModel(response);

        if(!"COMPLETED".equalsIgnoreCase(response.getStatus())){
            successPaymentOrderService.handleOrderDetails(false, payment, response.getPurchase_order_id());
            return false;
        }

        //for verification of the payment
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Key "+config.getLiveSecretKey());

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("pidx", response.getPidx());
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<Map> verificationResponse = restTemplate.postForEntity(config.getVerifyUrl(), entity, Map.class);

            if (verificationResponse.getStatusCode() == HttpStatus.OK && verificationResponse.getBody() != null) {
                Map<String,Object> body = verificationResponse.getBody();
                String status = (String) body.get("status");
                String transactionId = (String) body.get("transaction_id");
                if(!transactionId.isEmpty() && transactionId.equalsIgnoreCase(response.getTransaction_id()) && status.equalsIgnoreCase("Completed")){
                    successPaymentOrderService.handleOrderDetails(true, payment, response.getPurchase_order_id());
                    return true;
                }else{
                    successPaymentOrderService.handleOrderDetails(false, payment, response.getPurchase_order_id());
                    return false;
                }
            }
        } catch (Exception e) {
            log.error("Error while verifying payment! {}", e.getMessage());
        }
        return false;
    }

    public String generateUniqueId(){
        return UUID.randomUUID().toString();
    }

}