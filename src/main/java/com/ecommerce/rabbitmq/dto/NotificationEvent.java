package com.ecommerce.rabbitmq.dto;

import com.ecommerce.dto.intermediate.OrderItemDTO;
import com.ecommerce.model.notification.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class NotificationEvent implements Serializable {
    private String id;           // Unique ID for tracking
    private Long recipientId;  // UserID, DriverID, or StaffID
    private String title;        // e.g., "Order Confirmed!"
    private String message;      // e.g., "Your hair appointment is set for 2 PM."
    private NotificationType type;         // e.g., "ORDER", "APPOINTMENT", "PROMO"
    private LocalDateTime createdAt;

    private List<OrderItemDTO> itemSummary;
    // Extra data like orderId or status for the frontend to use
    private Map<String, Object> metadata;
}