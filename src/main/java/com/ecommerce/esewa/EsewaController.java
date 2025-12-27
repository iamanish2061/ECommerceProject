package com.ecommerce.esewa;

import com.ecommerce.mapper.payment.PaymentMapper;
import com.ecommerce.model.payment.PaymentModel;
import com.ecommerce.service.order.SuccessPaymentOrderService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
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
import java.io.PrintWriter;
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
    private final SuccessPaymentOrderService successPaymentOrderService;
    private final PaymentMapper paymentMapper;


//    controller that handles the form submission (internally forward to this controller for submitting form to esewa)
    @RequestMapping("/send-form-to-esewa")
    public void sendFormToEsewa(HttpServletRequest request, HttpServletResponse response) throws IOException {
        Esewa esewa = (Esewa) request.getAttribute("EsewaInfo");
        response.setContentType("text/html");
        PrintWriter out = response.getWriter();

        out.println("<html><body>");
        out.println("<form id='esewaForm' action='" + config.getPaymentUrl() + "' method='POST'>");
        out.println("<input type='hidden' name='amount' value='" + esewa.getAmount() + "' />");
        out.println("<input type='hidden' name='tax_amount' value='" + esewa.getTaxAmt() + "' />");
        out.println("<input type='hidden' name='total_amount' value='" + esewa.getTotal_amount() + "' />");
        out.println("<input type='hidden' name='transaction_uuid' value='" + esewa.getTransaction_uuid() + "' />");
        out.println("<input type='hidden' name='product_code' value='" + config.getMerchantId() + "' />");
        out.println("<input type='hidden' name='product_service_charge' value='" + esewa.getProductServiceCharge() + "' />");
        out.println("<input type='hidden' name='product_delivery_charge' value='" + esewa.getProductDeliveryCharge() + "' />");
        out.println("<input type='hidden' name='success_url' value='" + config.getResponseHandlingUrl() + "' />");
        out.println("<input type='hidden' name='failure_url' value='" + config.getResponseHandlingUrl() + "' />");
        out.println("<input type='hidden' name='signed_field_names' value='total_amount,transaction_uuid,product_code' />");
        out.println("<input type='hidden' name='signature' value='" + esewa.getSignature() + "' />");
        out.println("<input type='submit' id='submit-btn' value='Pay Now' style='display:none;'>");
        out.println("</form>");

//        auto submitting form
        out.println("<script>document.getElementById('esewaForm').submit();</script>");
        out.println("</body></html>");
    }

//    controller that handles the response received from esewa after payment is done
    @GetMapping("/esewa-response-handle")
    public RedirectView esewaResponseHandler(
            @RequestParam(required = false) String data
    ) throws IOException{

        if (data == null || data.isEmpty()) {
            successPaymentOrderService.handleOrderDetails(false, null);
            return new RedirectView("/failure.html");
        }

        Esewa paymentResponse = eSewaService.parseEsewaResponse(data);

        boolean validity = eSewaService.validateResponse(paymentResponse);
        PaymentModel payment = paymentMapper.mapEsewaToPaymentModel(paymentResponse);
        String query = "amount=" + URLEncoder.encode(payment.getAmount().toString(), StandardCharsets.UTF_8)
                + "&transactionId=" + URLEncoder.encode(payment.getTransactionId(), StandardCharsets.UTF_8);

        System.out.println(paymentResponse.toString());
        if(validity){
            successPaymentOrderService.handleOrderDetails(true, payment);
            return new RedirectView("/success.html?"+query);
        }else{
            successPaymentOrderService.handleOrderDetails(false, payment);
            return new RedirectView("/failure.html?"+query);
        }
    }


}
