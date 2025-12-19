package com.ecommerce.service.recommendation;

import com.ecommerce.model.activity.ActivityType;
import com.ecommerce.model.activity.UserActivity;
import com.ecommerce.repository.activity.UserActivityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserActivityService {

    private final UserActivityRepository userActivityRepository;

    @Transactional
    public void recordActivity(Long userId, Long productId, ActivityType activityType, int score){

        UserActivity userActivity =  userActivityRepository.findByUserIdAndProductIdAndActivityType(userId, productId, activityType)
                .orElse(new UserActivity());

        userActivity.setUserId(userId);
        userActivity.setProductId(productId);
        userActivity.setActivityType(activityType);
        userActivity.setScore(score);

        userActivityRepository.save(userActivity);
    }

}

