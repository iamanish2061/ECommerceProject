package com.ecommerce.rabbitmq.consumer;

import com.ecommerce.dto.request.email.EmailSenderRequest;
import com.ecommerce.model.notification.NotificationType;
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
        NotificationType castedType = NotificationType.valueOf(event.getType().toString());
        String userEmail = (String) event.getMetadata().get("email");

        switch (castedType) {
            case ORDER_PLACED:
                emailService.sendOrderInfoEmail(userEmail, event.getMetadata());
                break;
            case ORDER_CANCELLED:
                emailService.sendEmail(
                        new EmailSenderRequest(userEmail, "Order Cancelled", "<p>Your order has been cancelled.</p>")
                );
                break;
            case APPOINTMENT_BOOKED:
                emailService.sendEmail(
                        new EmailSenderRequest(userEmail, "Appointment Booked", "<p>Your appointment has been booked.</p>")
                );
                break;
            case APPOINTMENT_CANCELLED:
                emailService.sendEmail(
                        new EmailSenderRequest(userEmail, "Appointment Cancelled", "<p>Your appointment has been cancelled.</p>")
                );
                break;
        }
    }
}
