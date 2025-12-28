package com.ecommerce.khalti;

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
