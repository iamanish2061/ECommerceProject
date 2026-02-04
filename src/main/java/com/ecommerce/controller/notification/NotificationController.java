package com.ecommerce.controller.notification;

import com.ecommerce.controller.BaseController;
import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.notification.NotificationResponse;
import com.ecommerce.model.user.UserPrincipal;
import com.ecommerce.service.notification.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController extends BaseController {

    private final NotificationService notificationService;

    @GetMapping("/unread")
    @Operation(summary = "to fetch unread messages for notification div present in every page")
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getUnread(
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        if(currentUser == null){
            return unauthorized();
        }
        List<NotificationResponse> unreadNotifications = notificationService.getUnreadNotifications(currentUser.getUser().getId());
        return success(unreadNotifications, "Notifications fetched successfully");
    }

    @GetMapping("/count")
    @Operation(summary = "to fetch the number of unread notification to display on notification icon")
    public ResponseEntity<ApiResponse<Integer>> getCount(
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        if(currentUser == null){
            return unauthorized();
        }
        Integer unreadNotificationCount = notificationService.getUnreadNotificationCount(currentUser.getUser().getId());
        return success(unreadNotificationCount, "Notification count fetched");
    }

    @GetMapping("/all")
    @Operation(summary = "to fetch all notifications from db to show in notification page")
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getAllNotifications(
            @AuthenticationPrincipal UserPrincipal currentUser
    ){
        if(currentUser == null){
            return unauthorized();
        }
        List<NotificationResponse> allNotifications = notificationService.getAllNotifications(currentUser.getUser().getId());
        return success(allNotifications, "Fetched all notifications");
    }

    @PostMapping("/mark-read/{id}")
    @Operation(summary = "to handle mark as read button click")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal currentUser
    ){
        if(currentUser == null){
            return unauthorized();
        }
        notificationService.markAsRead(currentUser.getUser().getId(), id);
        return success("Notification with id: "+ id + "marked as read");
    }

    @PostMapping("/mark-all-read")
    @Operation(summary = "to handle mark as read button click")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(
            @AuthenticationPrincipal UserPrincipal currentUser
    ){
        if(currentUser == null){
            return unauthorized();
        }
        notificationService.markAllAsRead(currentUser.getUser().getId());
        return success("All notifications marked as read");
    }


}
