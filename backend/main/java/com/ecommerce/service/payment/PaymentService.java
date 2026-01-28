package com.ecommerce.service.payment;

import com.ecommerce.dto.intermediate.appointment.TempAppointmentDetails;
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

import java.math.BigDecimal;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final EsewaService esewaService;
    private final RedisService redisService;
    private final KhaltiService khaltiService;

    public String payWithKhalti(TempOrderDetails orderDetails) {
        String purchaseId = khaltiService.generateUniqueId();
        KhaltiRequest khaltiRequest = new KhaltiRequest(
                orderDetails.totalIncludingDeliveryCharge().multiply(BigDecimal.valueOf(100)),
                purchaseId,
                "Order");

        redisService.saveOrderDetails(purchaseId, orderDetails);
        KhaltiResponse khaltiResponse = khaltiService.initiatePayment(khaltiRequest);

        return khaltiResponse.getPayment_url();
    }

    public String payWithKhalti(TempAppointmentDetails appointmentDetails) {
        String purchaseId = appointmentDetails.getTransactionId();
        KhaltiRequest khaltiRequest = new KhaltiRequest(
                appointmentDetails.getAdvanceAmount().multiply(BigDecimal.valueOf(100)),
                purchaseId,
                "Appointment");

        redisService.saveTempAppointment(purchaseId, appointmentDetails);
        KhaltiResponse khaltiResponse = khaltiService.initiatePayment(khaltiRequest);

        return khaltiResponse.getPayment_url();
    }

    public Esewa payWithEsewa(TempOrderDetails orderDetails) {
        String redisKeyTransactionUuid = esewaService.generateTransactionUuid();
        Esewa esewa = new Esewa();
        esewa.setAmount(orderDetails.totalIncludingDeliveryCharge());
        esewa.setTaxAmt(BigDecimal.ZERO);
        esewa.setTotal_amount(orderDetails.totalIncludingDeliveryCharge()+"");
        esewa.setTransaction_uuid(redisKeyTransactionUuid);
        esewa.setProductServiceCharge(BigDecimal.ZERO);
        esewa.setProductDeliveryCharge(BigDecimal.ZERO);
        String data = esewaService.prepareDataForSignature(esewa.getTotal_amount(), esewa.getTransaction_uuid());
        esewa.setSignature(esewaService.getSignature(data));

        redisService.saveOrderDetails(redisKeyTransactionUuid, orderDetails);

        return esewa;
    }

    public Esewa payWithEsewa(TempAppointmentDetails appointmentDetails) {
        String redisKeyTransactionUuid = appointmentDetails.getTransactionId();
        Esewa esewa = new Esewa();
        esewa.setAmount(appointmentDetails.getAdvanceAmount());
        esewa.setTaxAmt(BigDecimal.ZERO);
        esewa.setTotal_amount(appointmentDetails.getAdvanceAmount()+"");
        esewa.setTransaction_uuid(redisKeyTransactionUuid);
        esewa.setProductServiceCharge(BigDecimal.ZERO);
        esewa.setProductDeliveryCharge(BigDecimal.ZERO);
        String data = esewaService.prepareDataForSignature(esewa.getTotal_amount(), esewa.getTransaction_uuid());
        esewa.setSignature(esewaService.getSignature(data));

        redisService.saveTempAppointment(appointmentDetails.getTransactionId(), appointmentDetails);

        return esewa;
    }

}
