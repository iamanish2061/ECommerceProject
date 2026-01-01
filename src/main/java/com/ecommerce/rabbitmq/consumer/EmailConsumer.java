package com.ecommerce.rabbitmq.consumer;

import com.ecommerce.rabbitmq.dto.NotificationEvent;
import com.ecommerce.service.email.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class EmailConsumer {

    private final EmailService emailService;

    @RabbitListener(queues = "email.notification.queue")
    public void processEmail(NotificationEvent event) {
        String userEmail = (String) event.getMetadata().get("email"); // Pass email in metadata

        switch (event.getType()) {
            case ORDER_PLACED:
                emailService.sendHtmlEmail(userEmail, "Order Confirmed!", "<h1>Thanks for your order...</h1>");
                break;
            case ORDER_CANCELLED:
                emailService.sendHtmlEmail(userEmail, "Order Cancelled", "<p>Your order has been cancelled.</p>");
                break;
            case APPOINTMENT_BOOKED:
                emailService.sendHtmlEmail(userEmail, "Booking Confirmed", "<h2>Your salon appointment is set!</h2>");
                break;
            case APPOINTMENT_CANCELLED:
                emailService.sendHtmlEmail(userEmail, "Booking Cancelled", "<h2>Your salon appointment is cancelled!</h2>");
                break;
        }
    }
}
