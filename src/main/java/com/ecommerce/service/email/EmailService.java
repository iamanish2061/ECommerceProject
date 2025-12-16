package com.ecommerce.service.email;

import com.ecommerce.dto.request.email.EmailSenderRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
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

}