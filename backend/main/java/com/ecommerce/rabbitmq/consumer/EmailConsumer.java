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
        if(event.getMetadata() == null){
            return;
        }
        String userEmail = String.valueOf(event.getMetadata().get("email"));

        switch (castedType) {
            case ORDER_PLACED:
                emailService.sendOrderInfoEmail(userEmail, event.getMetadata());
                break;
            case ORDER_CANCELLED:
                emailService.sendEmail(
                        new EmailSenderRequest(userEmail, "Order Cancelled", "Your order has been cancelled.")
                );
                break;
            case APPOINTMENT_BOOKED:
                emailService.sendEmail(
                        new EmailSenderRequest(userEmail, "Appointment Booked", "Your appointment has been booked.")
                );
                break;
            case APPOINTMENT_COMPLETED:
                emailService.sendEmail(
                        new EmailSenderRequest(userEmail, "Appointment Completed", "Your appointment has been completed.")
                );
                break;
            case APPOINTMENT_CANCELLED:
                emailService.sendEmail(
                        new EmailSenderRequest(userEmail, "Appointment Cancelled", "Your appointment has been cancelled.")
                );
                break;
        }
    }
}
