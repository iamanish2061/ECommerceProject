package com.ecommerce.service.payment;

import com.ecommerce.dto.intermediate.TempOrderDetails;
import com.ecommerce.esewa.Esewa;
import com.ecommerce.esewa.EsewaService;
import com.ecommerce.khalti.KhaltiRequest;
import com.ecommerce.khalti.KhaltiResponse;
import com.ecommerce.khalti.KhaltiService;
import com.ecommerce.redis.RedisService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.servlet.view.RedirectView;

import java.io.IOException;
import java.math.BigDecimal;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final EsewaService esewaService;
    private final RedisService redisService;
    private final KhaltiService khaltiService;

    public void payWithKhalti(TempOrderDetails orderDetails, BigDecimal totalIncludingDeliveryCharge,
                              HttpServletRequest httpServletRequest, HttpServletResponse httpServletResponse) {
        String purchaseId = khaltiService.generateUniqueId();
        KhaltiRequest khaltiRequest= new KhaltiRequest(
                totalIncludingDeliveryCharge.multiply(BigDecimal.valueOf(100)),
                purchaseId,
                "Order");

//        saving into redis
        redisService.saveOrderDetails(purchaseId, orderDetails);

        httpServletRequest.setAttribute("khaltiInfo", khaltiRequest);
        try {
            httpServletRequest.getRequestDispatcher("/api/payment/initiate-khalti-payment").forward(httpServletRequest, httpServletResponse);
        } catch (Exception e) {
            log.error("Error: {}",e.getMessage());
        }

    }

    public void payWithEsewa(TempOrderDetails orderDetails, BigDecimal totalIncludingDeliveryCharge, HttpServletRequest httpServletRequest, HttpServletResponse httpServletResponse) {
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

        //insert redis
        redisService.saveOrderDetails(redisKeyTransactionUuid, orderDetails);

        httpServletRequest.setAttribute("EsewaInfo", esewa);
        try {
            httpServletRequest.getRequestDispatcher("/api/payment/send-form-to-esewa").forward(httpServletRequest, httpServletResponse);
        } catch (Exception e) {
            log.error("Error: {}",e.getMessage());
        }

    }


}
