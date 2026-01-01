package com.ecommerce.rabbitmq.producer;


import com.ecommerce.rabbitmq.dto.NotificationEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class NotificationProducer {

    private final RabbitTemplate rabbitTemplate;

    @Value("${notification.exchange}")
    private String exchange;

    public void send(String routingKey, NotificationEvent event) {
        // Auto-generate ID and timestamp if they aren't set
        if (event.getId() == null) event.setId(UUID.randomUUID().toString());
        if (event.getCreatedAt() == null) event.setCreatedAt(LocalDateTime.now());

        log.info("Pushing notification to {}: {}", routingKey, event.getTitle());

        // This uses your custom ObjectMapper automatically
        rabbitTemplate.convertAndSend(exchange, routingKey, event);
    }
}

//how to use it
//@Autowired
//private NotificationProducer notificationProducer;
//
//public void completeBooking(Booking booking) {
//    // ... save booking to DB ...
//
//    NotificationEvent event = NotificationEvent.builder()
//            .recipientId(booking.getUserId())
//            .title("New Appointment")
//            .message("You have a new booking at 5 PM")
//            .type("APPOINTMENT")
//            .build();
//
//    notificationProducer.send("notify.user", event);
//}