package com.ecommerce.redis;

//import com.ecommerce.service.recommendation.SimilarUserUpdater;
import com.ecommerce.service.recommendation.SimilarUserUpdater;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import java.util.concurrent.TimeUnit;


@RequiredArgsConstructor
@Service
public class RedisService {

    private static final Logger log = LoggerFactory.getLogger(RedisService.class);
    private final RedisTemplate redisTemplate;
    private final SimilarUserUpdater similarUserUpdater;

    public String getCode(String key){
        try{
            Object o = redisTemplate.opsForValue().get(key);
            return (o!=null)? o.toString():null;
        }catch (Exception e){
            log.error("Exception ",e);
            return null;
        }
    }

    public boolean setCode(String key, String value, Long ttl){
        try{
            redisTemplate.opsForValue().set(key, value, ttl, TimeUnit.SECONDS);
            return true;
        }catch (Exception e){
            log.error("Exception " ,e);
            return false;
        }
    }

    public void deleteCode(String email) {
        redisTemplate.delete(email);
    }

    public void incrementUserVector(Long userId, Long productId, int score) {
        String key = "user_vector:" + userId;
        redisTemplate.opsForHash().increment(key, productId.toString(), score);
        redisTemplate.expire(key, 90, TimeUnit.DAYS);           // Optional: expire in 90 days if user inactive
    }

    public void updateViewedProduct(Long userId, Long productId){
        String viewedKey = "viewed:"+userId+":"+productId;
        boolean alreadyViewed = redisTemplate.hasKey(viewedKey);
        if(!alreadyViewed){
            incrementUserVector(userId, productId, 1);
            redisTemplate.opsForValue().set(viewedKey, "1", 48, TimeUnit.HOURS);
        }
        similarUserUpdater.updateSimilarUsersAsync(userId);
    }

}


