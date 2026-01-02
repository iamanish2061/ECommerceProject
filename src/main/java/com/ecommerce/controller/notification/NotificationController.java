package com.ecommerce.controller.notification;

import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.exception.ApplicationException;
import com.ecommerce.model.user.UserPrincipal;
import com.ecommerce.rabbitmq.dto.NotificationEvent;
import com.ecommerce.redis.RedisService;
import com.ecommerce.repository.notification.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final RedisService redisService;
    private final NotificationRepository notificationRepository;

//    GET 1: The "Hot" list for the notification bell dropdown.
//    Fetches only unread items from Redis.
    @GetMapping("/unread")
    public ResponseEntity<ApiResponse<List<NotificationEvent>>> getUnread(
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        if(currentUser == null){
            throw new ApplicationException("Please login to continue!", "NOT_LOGGED_IN", HttpStatus.UNAUTHORIZED);
        }
        List<NotificationEvent> unreadNotifications = redisService.getUnreadNotifications(currentUser.getUser().getId());
        return ResponseEntity.ok(ApiResponse.ok(unreadNotifications, "Notifications fetched successfully"));
    }

//    GET 2: The "Badge Count" for the bell icon.
    @GetMapping("/count")
    public ResponseEntity<ApiResponse<?>> getCount(
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        if(currentUser == null){
            throw new ApplicationException("Please login to continue!", "NOT_LOGGED_IN", HttpStatus.UNAUTHORIZED);
        }
        return ResponseEntity.ok(ApiResponse.ok(redisService.getUnreadCount(String.valueOf(currentUser.getUser().getId())), "Notification count fetched"));
    }

//    all ko baki xa

//    mark as read ko baki xa

//    mark all as read ko baki

//    POST 3: Mark a specific notification as read.
//    Removes from Redis and updates SQL.
//    @PostMapping("/{userId}/read/{notificationId}")
//    public ResponseEntity<Void> markAsRead(@PathVariable String userId, @PathVariable String notificationId) {
//        // 1. Remove from the Redis "Hot List"
//        redisService.removeNotificationFromRedis(userId, notificationId);
//
//        // 2. Update status in Database
//        notificationRepository.findById(notificationId).ifPresent(n -> {
//            n.setRead(true);
//            notificationRepository.save(n);
//        });
//
//        return ResponseEntity.ok().build();
//    }

//    GET 4: Full history (View All).
//    Fetches from SQL Database with pagination.
//    @GetMapping("/history/{userId}")
//    public ResponseEntity<Page<Notification>> getHistory(@PathVariable String userId, Pageable pageable) {
//        return ResponseEntity.ok(notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId));
//    }
}
