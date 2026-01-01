package com.ecommerce.rabbitmq.handler;

import com.ecommerce.model.notification.Notification;
import com.ecommerce.model.notification.NotificationType;
import com.ecommerce.rabbitmq.dto.NotificationEvent;
import com.ecommerce.redis.RedisService;
import com.ecommerce.repository.notification.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@Slf4j
@RequiredArgsConstructor
public class NotificationHandler {

    private final NotificationRepository notificationRepository;
    private final RedisService redisService;
    private final SimpMessagingTemplate messagingTemplate;

    private static final Long ADMIN_ID = 3L;

    @Transactional
    public void handle(NotificationEvent event) {
        NotificationType eventCastedType = NotificationType.valueOf(event.getType().toString());
        // 1. Permanent Store: Save to SQL DB
        Notification notification = Notification.builder()
                .id(event.getId())
                .recipientId(event.getRecipientId())
                .title(event.getTitle())
                .message(event.getMessage())
                .type(eventCastedType)
                .createdAt(event.getCreatedAt() != null ? event.getCreatedAt() : LocalDateTime.now())
                .isRead(false)
                .build();
        notificationRepository.save(notification);

        // 2. Hot Store: Save only unread to Redis List
        if(eventCastedType == NotificationType.ORDER_PLACED || eventCastedType == NotificationType.ORDER_CANCELLED || eventCastedType == NotificationType.ORDER_DELIVERED){
            sendToUser(event);
            sendToAdmin(event);
        } else if (eventCastedType == NotificationType.ORDER_SHIPPED) {
            sendToUser(event);
        } else if (eventCastedType== NotificationType.APPOINTMENT_BOOKED || eventCastedType == NotificationType.APPOINTMENT_CANCELLED) {
           sendToUser(event);
           sendToAdmin(event);
           sendToStaff(event);
        } else if (eventCastedType == NotificationType.DRIVER_ASSIGN) {
            sendToDriver(event);
            sendToAdmin(event);
        }

    }

    public void sendToUser(NotificationEvent event){
        // 2. Hot Store: Save only unread to Redis List
        redisService.addUnreadNotification(event.getRecipientId(), event);
        // 3. Real-Time Push: Notify the UI
        messagingTemplate.convertAndSendToUser(
                String.valueOf(event.getRecipientId()),
                "/queue/notifications",
                event
        );
    }

    public void sendToAdmin(NotificationEvent event){
        redisService.addUnreadNotification(ADMIN_ID, event);
        messagingTemplate.convertAndSendToUser(
                String.valueOf(ADMIN_ID),
                "/queue/notifications",
                event
        );
    }

    public void sendToStaff(NotificationEvent event){
        Object staffIdObj = event.getMetadata().get("staffId");
        if (staffIdObj != null) {
            Long staffId = Long.valueOf(staffIdObj.toString());
            redisService.addUnreadNotification(staffId, event);
            messagingTemplate.convertAndSendToUser(
                    String.valueOf(staffId),
                    "/queue/notifications",
                    event
            );
        }
    }

    public void sendToDriver(NotificationEvent event){
        Object driverIdObj = event.getMetadata().get("driverId");
        if (driverIdObj != null) {
            Long driverId = Long.valueOf(driverIdObj.toString());
            redisService.addUnreadNotification(driverId, event);
            messagingTemplate.convertAndSendToUser(
                    String.valueOf(driverId),
                    "/queue/notifications",
                    event
            );
        }
    }


}