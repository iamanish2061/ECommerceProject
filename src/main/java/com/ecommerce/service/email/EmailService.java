package com.ecommerce.service.email;

import com.ecommerce.dto.request.email.EmailSenderRequest;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender javaMailSender;
    private final org.thymeleaf.TemplateEngine templateEngine;

    public boolean sendEmail(EmailSenderRequest emailSender) {
        try{
            SimpleMailMessage mail = new SimpleMailMessage();
            mail.setTo(emailSender.to());
            mail.setSubject(emailSender.subject());
            mail.setText(emailSender.body());
            javaMailSender.send(mail);
            return true;
        }catch (Exception e){
            log.error("Exception while sending mail! :{}", e.getMessage());
            return false;
        }

    }

    public void sendOrderInfoEmail(String to, Map<String, Object> metadata) {
        org.thymeleaf.context.Context context = new org.thymeleaf.context.Context();
        context.setVariables(metadata);

        try {
            // Process the HTML template
            String htmlContent = templateEngine.process("order-info", context);

            MimeMessage mimeMessage = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setTo(to);
            helper.setSubject("Your Order Info - " + metadata.get("transactionId"));
            helper.setText(htmlContent, true);

            javaMailSender.send(mimeMessage);
            log.info("Order info email sent to: {}", to);
        } catch (Exception e) {
            log.error("Failed to send order info email: {}", e.getMessage());
        }
    }

}