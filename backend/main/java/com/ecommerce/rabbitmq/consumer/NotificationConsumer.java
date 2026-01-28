package com.ecommerce.rabbitmq.consumer;

import com.ecommerce.rabbitmq.handler.NotificationHandler;
import com.ecommerce.rabbitmq.dto.NotificationEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
@Slf4j
@RequiredArgsConstructor
public class NotificationConsumer {

    private final NotificationHandler notificationHandler;

    // This one method can listen to multiple queues
    @RabbitListener(queues = {"user.notification.queue", "driver.notification.queue", "staff.notification.queue"})
    public void consumeNotification(NotificationEvent event) {
        log.info("Received message from RabbitMQ for recipient: {}", event.getRecipientId());

        // Pass the DTO to the handler to save to DB and push to WebSockets
        notificationHandler.handle(event);
    }
}
