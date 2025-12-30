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
        redisService.deleteEsewaObjectDetails(payment.getTransactionId());
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
