package com.ecommerce.service.recommendation;

import com.ecommerce.model.activity.ActivityType;
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

        userActivityRepository.upsertActivity(userId, productId, String.valueOf(activityType), score);

    }

}

