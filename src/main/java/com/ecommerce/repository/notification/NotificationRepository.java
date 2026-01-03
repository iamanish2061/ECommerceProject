package com.ecommerce.repository.notification;

import com.ecommerce.model.notification.Notification;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, String> {

    List<Notification> findAllByRecipientIdOrderByCreatedAtDesc(Long recipientId);

    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.recipientId = :userId AND n.isRead = false")
    void markAllAsReadForUser(@Param("userId") Long userId);

}
