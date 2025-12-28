package com.ecommerce.service.payment;

import com.ecommerce.dto.intermediate.TempOrderDetails;
import com.ecommerce.esewa.Esewa;
import com.ecommerce.esewa.EsewaService;
import com.ecommerce.khalti.KhaltiRequest;
import com.ecommerce.khalti.KhaltiResponse;
import com.ecommerce.khalti.KhaltiService;
import com.ecommerce.redis.RedisService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.math.BigDecimal;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final EsewaService esewaService;
    private final RedisService redisService;
    private final KhaltiService khaltiService;

    public String payWithKhalti(TempOrderDetails orderDetails, BigDecimal totalIncludingDeliveryCharge) {
        String purchaseId = khaltiService.generateUniqueId();
        KhaltiRequest khaltiRequest = new KhaltiRequest(
                totalIncludingDeliveryCharge.multiply(BigDecimal.valueOf(100)),
                purchaseId,
                "Order");

        redisService.saveOrderDetails(purchaseId, orderDetails);
        KhaltiResponse khaltiResponse = khaltiService.initiatePayment(khaltiRequest);

        return khaltiResponse.getPayment_url();
    }

    public String payWithEsewa(TempOrderDetails orderDetails, BigDecimal totalIncludingDeliveryCharge) {
        String redisKeyTransactionUuid = esewaService.generateTransactionUuid();
        Esewa esewa = new Esewa();
        esewa.setAmount(totalIncludingDeliveryCharge);
        esewa.setTaxAmt(BigDecimal.ZERO);
        esewa.setTotal_amount(totalIncludingDeliveryCharge+"");
        esewa.setTransaction_uuid(redisKeyTransactionUuid);
        esewa.setProductServiceCharge(BigDecimal.ZERO);
        esewa.setProductDeliveryCharge(BigDecimal.ZERO);
        String data = esewaService.prepareDataForSignature(esewa.getTotal_amount(), esewa.getTransaction_uuid());
        esewa.setSignature(esewaService.getSignature(data));

        redisService.saveOrderDetails(redisKeyTransactionUuid, orderDetails);
        redisService.saveEsewaObject(redisKeyTransactionUuid, esewa);

        String baseUrl = ServletUriComponentsBuilder.fromCurrentContextPath().build().toUriString();
        return baseUrl + "/api/payment/send-form-to-esewa?uuid=" + redisKeyTransactionUuid;
    }

}
