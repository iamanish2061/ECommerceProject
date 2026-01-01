package com.ecommerce.service.email;

import com.ecommerce.dto.request.email.EmailSenderRequest;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender javaMailSender;

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

    public void sendHtmlEmail(String to, String subject, String htmlBody) {
        try {
            MimeMessage message = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true); // Set to true for HTML content

            javaMailSender.send(message);
        } catch (Exception e) {
            log.error("Failed to send email to {}", to, e);
        }
    }

}