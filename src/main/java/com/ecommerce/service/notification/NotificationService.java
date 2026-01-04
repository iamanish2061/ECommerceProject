package com.ecommerce.service.notification;

import com.ecommerce.dto.response.notification.NotificationResponse;
import com.ecommerce.mapper.notification.NotificationMapper;
import com.ecommerce.model.notification.Notification;
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

    public List<NotificationResponse> getUnreadNotifications(Long userId) {
        List<Notification> notifications = redisService.getUnreadNotifications(userId);
        return notifications.stream()
                        .map(notificationMapper::mapEntityToNotificationResponse)
                .toList();
    }

    public Integer getUnreadNotificationCount(Long userId) {
        return redisService.getUnreadCount(userId);
    }

    public List<NotificationResponse> getAllNotifications(Long userId) {
        List<Notification> notifications = notificationRepository.findAllByRecipientIdOrderByCreatedAtDesc(userId);
        if(notifications.isEmpty()){
            return new ArrayList<>();
        }

        notifications.forEach(System.out::println);
        return notifications.stream()
                .map(notificationMapper::mapEntityToNotificationResponse)
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

