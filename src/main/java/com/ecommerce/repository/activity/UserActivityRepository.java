package com.ecommerce.repository.activity;

import com.ecommerce.model.activity.ActivityType;
import com.ecommerce.model.activity.UserActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserActivityRepository extends JpaRepository<UserActivity, Long> {

    List<UserActivity> findByUserId(Long userId);

    Optional<UserActivity> findByUserIdAndProductIdAndActivityType(Long userId, Long productId, ActivityType type);

    @Modifying
    @Query(value = "INSERT INTO user_activity (user_id, product_id, activity_type, score) " +
            "VALUES (:userId, :productId, CAST(:activityType AS text), :score) " + // Explicit cast
            "ON CONFLICT (user_id, product_id, activity_type) " +
            "DO UPDATE SET score = user_activity.score + EXCLUDED.score", nativeQuery = true)
    void upsertActivity(
            @Param("userId") Long userId,
            @Param("productId") Long productId,
            @Param("activityType") String activityType, // Pass as String
            @Param("score") int score
    );

}
