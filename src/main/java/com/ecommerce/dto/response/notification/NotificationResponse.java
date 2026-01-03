package com.ecommerce.dto.response.notification;

import com.ecommerce.model.notification.NotificationType;

import java.time.LocalDateTime;

public record NotificationResponse(
        String id,
        String title,      // e.g., "Order Confirmed!"
        String message,      // e.g., "Your hair appointment is set for 2 PM."
        NotificationType type,
        LocalDateTime createdAt,
        boolean isRead
) {
}
