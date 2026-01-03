package com.ecommerce.khalti;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.view.RedirectView;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/payment")
public class KhaltiController {

    private final KhaltiService khaltiService;

    @GetMapping("/khalti-response-handle")
    public RedirectView handleResponse(KhaltiCallbackDTO values) {
        boolean isVerified = khaltiService.verifyPayment(values);
        String query = "amount=" + URLEncoder.encode(values.getAmount().toString(), StandardCharsets.UTF_8)
                + "&transactionId=" + URLEncoder.encode(values.getTransaction_id(), StandardCharsets.UTF_8);
        if (isVerified)
            return new RedirectView("/success.html"+query);
        else{
            return new RedirectView("/failure.html"+query);
        }
    }
}
