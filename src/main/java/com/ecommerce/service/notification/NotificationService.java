package com.ecommerce.service.notification;

import com.ecommerce.dto.response.notification.NotificationResponse;
import com.ecommerce.mapper.notification.NotificationMapper;
import com.ecommerce.model.notification.Notification;
import com.ecommerce.rabbitmq.dto.NotificationEvent;
import com.ecommerce.redis.RedisService;
import com.ecommerce.repository.notification.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final RedisService redisService;
    private final NotificationRepository notificationRepository;
    private final NotificationMapper notificationMapper;

    public List<NotificationResponse> getUnreadNotifications(Long id) {
        List<NotificationEvent> notifications = redisService.getUnreadNotifications(id);
        return notifications.stream()
                        .map(notificationMapper::mapEventToNotificationResponse)
                .toList();
    }

    public Integer getUnreadNotificationCount(Long id) {
        return redisService.getUnreadCount(String.valueOf(id));
    }

    public List<NotificationResponse> getAllNotifications(Long id) {
        List<Notification> notifications = notificationRepository.findAllByRecipientIdOrderByCreatedAtDesc(id);
        if(notifications.isEmpty()){
            return new ArrayList<>();
        }
        return notifications.stream()
                .map(notificationMapper::mapEntityToNotificationResponce)
                .toList();
    }

    @Transactional
    public void markAsRead(Long userId, String notificationId) {
        redisService.removeNotificationFromRedis(String.valueOf(userId), notificationId);
        notificationRepository.findById(notificationId).ifPresent(n -> {
            n.setRead(true);
            notificationRepository.save(n);
        });
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        redisService.removeAllNotificationFromRedis(String.valueOf(userId));
        notificationRepository.markAllAsReadForUser(userId);
    }

}

