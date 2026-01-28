package com.ecommerce.controller.notification;

import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.notification.NotificationResponse;
import com.ecommerce.exception.ApplicationException;
import com.ecommerce.model.user.UserPrincipal;
import com.ecommerce.service.notification.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping("/unread")
    @Operation(summary = "to fetch unread messages for notification div present in every page")
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getUnread(
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        if(currentUser == null){
            throw new ApplicationException("Please login to continue!", "NOT_LOGGED_IN", HttpStatus.UNAUTHORIZED);
        }
        List<NotificationResponse> unreadNotifications = notificationService.getUnreadNotifications(currentUser.getUser().getId());
        return ResponseEntity.ok(ApiResponse.ok(unreadNotifications, "Notifications fetched successfully"));
    }

    @GetMapping("/count")
    @Operation(summary = "to fetch the number of unread notification to display on notification icon")
    public ResponseEntity<ApiResponse<?>> getCount(
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        if(currentUser == null){
            throw new ApplicationException("Please login to continue!", "NOT_LOGGED_IN", HttpStatus.UNAUTHORIZED);
        }
        Integer unreadNotificationCount = notificationService.getUnreadNotificationCount(currentUser.getUser().getId());
        return ResponseEntity.ok(ApiResponse.ok(unreadNotificationCount, "Notification count fetched"));
    }

    @GetMapping("/all")
    @Operation(summary = "to fetch all notifications from db to show in notification page")
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getAllNotifications(
            @AuthenticationPrincipal UserPrincipal currentUser
    ){
        if(currentUser == null){
            throw new ApplicationException("Please login to continue!", "NOT_LOGGED_IN", HttpStatus.UNAUTHORIZED);
        }
        List<NotificationResponse> allNotifications = notificationService.getAllNotifications(currentUser.getUser().getId());
        return ResponseEntity.ok(ApiResponse.ok(allNotifications, "Fetched all notifications"));
    }

    @PostMapping("/mark-read/{id}")
    @Operation(summary = "to handle mark as read button click")
    public ResponseEntity<ApiResponse<?>> markAsRead(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal currentUser
    ){
        if(currentUser == null){
            throw new ApplicationException("Please login to continue!", "NOT_LOGGED_IN", HttpStatus.UNAUTHORIZED);
        }
        notificationService.markAsRead(currentUser.getUser().getId(), id);
        return ResponseEntity.ok(ApiResponse.ok("Notification with id: "+ id + "marked as read"));
    }

    @PostMapping("/mark-all-read")
    @Operation(summary = "to handle mark as read button click")
    public ResponseEntity<ApiResponse<?>> markAllAsRead(
            @AuthenticationPrincipal UserPrincipal currentUser
    ){
        if(currentUser == null){
            throw new ApplicationException("Please login to continue!", "NOT_LOGGED_IN", HttpStatus.UNAUTHORIZED);
        }
        notificationService.markAllAsRead(currentUser.getUser().getId());
        return ResponseEntity.ok(ApiResponse.ok("All notifications marked as read"));
    }


}
