package com.ecommerce.repository.activity;

import com.ecommerce.model.activity.ActivityType;
import com.ecommerce.model.activity.UserActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserActivityRepository extends JpaRepository<UserActivity, Long> {

    Optional<UserActivity> findByUserIdAndProductIdAndActivityType(Long userId, Long productId, ActivityType type);


}
