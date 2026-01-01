package com.ecommerce.rabbitmq.dto;

import com.ecommerce.model.notification.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.Map;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class NotificationEvent implements Serializable {
    private String id;           // Unique ID for tracking
    private String recipientId;  // UserID, DriverID, or StaffID
    private String title;        // e.g., "Order Confirmed!"
    private String message;      // e.g., "Your hair appointment is set for 2 PM."
    private NotificationType type;         // e.g., "ORDER", "APPOINTMENT", "PROMO"
    private LocalDateTime createdAt;

    // Extra data like orderId or status for the frontend to use
    private Map<String, Object> metadata;
}