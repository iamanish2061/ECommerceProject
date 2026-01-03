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

        if(eventCastedType == NotificationType.ORDER_PLACED || eventCastedType == NotificationType.ORDER_CANCELLED || eventCastedType == NotificationType.ORDER_DELIVERED){
            saveAndSendToUser(event);
            saveAndSendToAdmin(event);
        } else if (eventCastedType == NotificationType.ORDER_SHIPPED) {
            saveAndSendToUser(event);
        } else if (eventCastedType== NotificationType.APPOINTMENT_BOOKED || eventCastedType == NotificationType.APPOINTMENT_CANCELLED) {
            saveAndSendToUser(event);
            saveAndSendToAdmin(event);
            saveAndSendToStaff(event);
        } else if (eventCastedType == NotificationType.DRIVER_ASSIGN) {
            saveAndSendToDriver(event);
            saveAndSendToAdmin(event);
        }

    }

    public void saveAndSendToUser(NotificationEvent event){
        // 1. Permanent Store: Save to SQL DB
        Notification notification = Notification.builder()
                .id(event.getId())
                .recipientId(event.getRecipientId())
                .title(event.getTitle())
                .message(event.getMessage())
                .type(NotificationType.valueOf(event.getType().toString()))
                .createdAt(event.getCreatedAt() != null ? event.getCreatedAt() : LocalDateTime.now())
                .isRead(false)
                .build();
        notificationRepository.save(notification);
        // 2. Hot Store: Save only unread to Redis List
        redisService.addUnreadNotification(event.getRecipientId(), event);
        // 3. Real-Time Push: Notify the UI
        messagingTemplate.convertAndSendToUser(
                String.valueOf(event.getRecipientId()),
                "/queue/notifications",
                event
        );
    }

    public void saveAndSendToAdmin(NotificationEvent event){
        Notification notification = Notification.builder()
                .id(event.getId())
                .recipientId(ADMIN_ID)
                .title(event.getTitle())
                .message(event.getMessage())
                .type(NotificationType.valueOf(event.getType().toString()))
                .createdAt(event.getCreatedAt() != null ? event.getCreatedAt() : LocalDateTime.now())
                .isRead(false)
                .build();
        notificationRepository.save(notification);

        redisService.addUnreadNotification(ADMIN_ID, event);
        messagingTemplate.convertAndSendToUser(
                String.valueOf(ADMIN_ID),
                "/queue/notifications",
                event
        );
    }

    public void saveAndSendToStaff(NotificationEvent event){
        Object staffIdObj = event.getMetadata().get("staffId");
        if (staffIdObj != null) {
            Long staffId = Long.valueOf(staffIdObj.toString());
            Notification notification = Notification.builder()
                    .id(event.getId())
                    .recipientId(staffId)
                    .title(event.getTitle())
                    .message(event.getMessage())
                    .type(NotificationType.valueOf(event.getType().toString()))
                    .createdAt(event.getCreatedAt() != null ? event.getCreatedAt() : LocalDateTime.now())
                    .isRead(false)
                    .build();
            notificationRepository.save(notification);

            redisService.addUnreadNotification(staffId, event);
            messagingTemplate.convertAndSendToUser(
                    String.valueOf(staffId),
                    "/queue/notifications",
                    event
            );
        }
    }

    public void saveAndSendToDriver(NotificationEvent event){
        Object driverIdObj = event.getMetadata().get("driverId");
        if (driverIdObj != null) {
            Long driverId = Long.valueOf(driverIdObj.toString());

            Notification notification = Notification.builder()
                    .id(event.getId())
                    .recipientId(driverId)
                    .title(event.getTitle())
                    .message(event.getMessage())
                    .type(NotificationType.valueOf(event.getType().toString()))
                    .createdAt(event.getCreatedAt() != null ? event.getCreatedAt() : LocalDateTime.now())
                    .isRead(false)
                    .build();
            notificationRepository.save(notification);

            redisService.addUnreadNotification(driverId, event);
            messagingTemplate.convertAndSendToUser(
                    String.valueOf(driverId),
                    "/queue/notifications",
                    event
            );
        }
    }


}