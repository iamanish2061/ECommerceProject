package com.ecommerce.model.notification;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data
@Builder
@NoArgsConstructor @AllArgsConstructor
public class Notification {
    @Id
    private String id;  // Matches the UUID from the DTO

    private Long recipientId;
    private String title;
    private String message;
    private NotificationType type;

    private boolean isRead; // Important for your "Unread" tracking

    private LocalDateTime createdAt;
}


