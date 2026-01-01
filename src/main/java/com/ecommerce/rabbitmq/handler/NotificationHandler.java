package com.ecommerce.rabbitmq.handler;

import com.ecommerce.model.notification.Notification;
import com.ecommerce.rabbitmq.dto.NotificationEvent;
import com.ecommerce.redis.RedisService;
import com.ecommerce.repository.notification.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Slf4j
@RequiredArgsConstructor
public class NotificationHandler {

    private final NotificationRepository notificationRepository;
    private final RedisService redisService;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public void handle(NotificationEvent event) {
        // 1. Permanent Store: Save to SQL DB
        Notification notification = Notification.builder()
                .id(event.getId())
                .recipientId(event.getRecipientId())
                .title(event.getTitle())
                .message(event.getMessage())
                .type(event.getType())
                .createdAt(event.getCreatedAt())
                .isRead(false)
                .build();
        notificationRepository.save(notification);

        // 2. Hot Store: Save only unread to Redis List
        redisService.addUnreadNotification(event.getRecipientId(), event);


        // 3. Real-Time Push: Notify the UI
        messagingTemplate.convertAndSendToUser(
                event.getRecipientId(),
                "/queue/notifications",
                event
        );
    }
}