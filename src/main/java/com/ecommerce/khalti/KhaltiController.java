package com.ecommerce.khalti;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.view.RedirectView;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/payment")
public class KhaltiController {

    private KhaltiService khaltiService;

    @GetMapping("/initiate-khalti-payment")
    public RedirectView initiatePayment(HttpServletRequest httpServletRequest,
                                        HttpServletResponse httpServletResponse){
        KhaltiRequest khaltiRequest = (KhaltiRequest) httpServletRequest.getAttribute("khaltiInfo");

        KhaltiResponse khaltiResponse = khaltiService.initiatePayment(khaltiRequest);
        String paymentRedirectionUrl = khaltiResponse.getPayment_url();
        return new RedirectView(paymentRedirectionUrl);
    }

    @GetMapping("/khalti-response-handle")
    public RedirectView handleResponse(KhaltiCallbackDTO values) {
        boolean isVerified = khaltiService.verifyPayment(values);
        if (isVerified)
            return new RedirectView("/success.html");
        else{
            return new RedirectView("/failure.html");
        }
    }
}
