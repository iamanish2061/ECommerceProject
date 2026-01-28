package com.ecommerce.model.notification;

import jakarta.persistence.*;
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

    @Enumerated(EnumType.STRING)
    @Column(name = "type")
    private NotificationType type;

    private boolean isRead; // Important for your "Unread" tracking

    private LocalDateTime createdAt;
}


