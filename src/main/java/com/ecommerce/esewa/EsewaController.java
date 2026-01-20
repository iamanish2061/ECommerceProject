package com.ecommerce.esewa;

import com.ecommerce.mapper.payment.PaymentMapper;
import com.ecommerce.model.payment.PaymentModel;
import com.ecommerce.service.appointment.AppointmentPersistService;
import com.ecommerce.service.order.OrderPersistService;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
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

    private final EsewaService eSewaService;
    private final OrderPersistService orderPersistService;
    private final AppointmentPersistService appointmentPersistService;
    private final PaymentMapper paymentMapper;


//    controller that handles the response received from esewa after payment is done
    @GetMapping("/esewa-response-handle")
    public RedirectView esewaResponseHandler(
            @RequestParam(required = false) String data
    ) throws IOException{
        if (data == null || data.isEmpty()) {
            return new RedirectView("/failure.html");
        }
        Esewa paymentResponse = eSewaService.parseEsewaResponse(data);

        boolean validity = eSewaService.validateResponse(paymentResponse);
        PaymentModel payment = paymentMapper.mapEsewaToPaymentModel(paymentResponse);
        String query = "amount=" + URLEncoder.encode(payment.getAmount().toString(), StandardCharsets.UTF_8)
                + "&transactionId=" + URLEncoder.encode(payment.getTransactionId(), StandardCharsets.UTF_8);

        if(validity){
            if(payment.getTransactionId().startsWith("APT_")){
                appointmentPersistService.handleEsewaAppointmentDetails(true, payment);
            }else{
                orderPersistService.handleEsewaOrderDetails(true, payment);
            }
            return new RedirectView("/success.html?"+query);
        }else{
            if(payment.getTransactionId().startsWith("APT_")){
                appointmentPersistService.handleEsewaAppointmentDetails(false, payment);
            }else{
                orderPersistService.handleEsewaOrderDetails(false, payment);
            }
            return new RedirectView("/failure.html?"+query);
        }
    }


}
