package com.ecommerce.esewa;

import com.ecommerce.mapper.payment.PaymentMapper;
import com.ecommerce.model.payment.PaymentModel;
import com.ecommerce.redis.RedisService;
import com.ecommerce.service.order.OrderPersistService;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.view.RedirectView;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@RestController
@Getter
@Setter
@RequiredArgsConstructor
@RequestMapping("/api/payment")
public class EsewaController {

    private static final Logger log = LoggerFactory.getLogger(EsewaController.class);
    private final EsewaService eSewaService;
    private final EsewaConfig config;
    private final OrderPersistService orderPersistService;
    private final PaymentMapper paymentMapper;
    private final RedisService redisService;


//    controller that handles the form submission (internally forward to this controller for submitting form to esewa)
    @RequestMapping("/send-form-to-esewa")
    public ResponseEntity<String> sendFormToEsewa(@RequestParam String uuid) throws IOException {
        Esewa esewa = redisService.getEsewaObject(uuid);
        if (esewa == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        String html = """
            <!DOCTYPE html>
            <html>
            <head>
                <title>Redirecting to eSewa...</title>
            </head>
            <body onload="document.forms['esewaForm'].submit()">
                <div style="text-align: center; margin-top: 50px;">
                    <h2>Redirecting to eSewa Payment Gateway...</h2>
                    <p>Please do not refresh the page.</p>
                </div>
                <form id="esewaForm" action="%s" method="POST">
                    <input type="hidden" name="amount" value="%s">
                    <input type="hidden" name="tax_amount" value="%s">
                    <input type="hidden" name="total_amount" value="%s">
                    <input type="hidden" name="transaction_uuid" value="%s">
                    <input type="hidden" name="product_code" value="%s">
                    <input type="hidden" name="product_service_charge" value="0">
                    <input type="hidden" name="product_delivery_charge" value="0">
                    <input type="hidden" name="success_url" value="%s">
                    <input type="hidden" name="failure_url" value="%s">
                    <input type="hidden" name="signed_field_names" value="total_amount,transaction_uuid,product_code">
                    <input type="hidden" name="signature" value="%s">
                    <noscript>
                        <p>JavaScript is disabled. Please click the button below to proceed.</p>
                        <input type="submit" value="Pay with eSewa">
                    </noscript>
                </form>
            </body>
            </html>
            """.formatted(
                    config.getPaymentUrl(),
                        esewa.getAmount(),
                        esewa.getTaxAmt(),
                        esewa.getTotal_amount(),
                        esewa.getTransaction_uuid(),
                        config.getMerchantId(),
                        config.getResponseHandlingUrl(),
                        config.getResponseHandlingUrl(),
                        esewa.getSignature()
        );
        redisService.deleteEsewaObjectDetails(uuid);
        return ResponseEntity.ok().contentType(MediaType.TEXT_HTML).body(html);
    }


//    controller that handles the response received from esewa after payment is done
    @GetMapping("/esewa-response-handle")
    public RedirectView esewaResponseHandler(
            @RequestParam(required = false) String data
    ) throws IOException{
        if (data == null || data.isEmpty()) {
            orderPersistService.handleEsewaOrderDetails(false, null);
            return new RedirectView("/failure.html");
        }
        Esewa paymentResponse = eSewaService.parseEsewaResponse(data);

        boolean validity = eSewaService.validateResponse(paymentResponse);
        PaymentModel payment = paymentMapper.mapEsewaToPaymentModel(paymentResponse);
        String query = "amount=" + URLEncoder.encode(payment.getAmount().toString(), StandardCharsets.UTF_8)
                + "&transactionId=" + URLEncoder.encode(payment.getTransactionId(), StandardCharsets.UTF_8);

        System.out.println(paymentResponse.toString());
        if(validity){
            orderPersistService.handleEsewaOrderDetails(true, payment);
            return new RedirectView("/success.html?"+query);
        }else{
            orderPersistService.handleEsewaOrderDetails(false, payment);
            return new RedirectView("/failure.html?"+query);
        }
    }


}
