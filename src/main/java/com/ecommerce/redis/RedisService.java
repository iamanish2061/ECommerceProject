package com.ecommerce.redis;

import com.ecommerce.dto.intermediate.TempOrderDetails;
import com.ecommerce.service.recommendation.SimilarUserUpdater;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
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
    private ObjectMapper objectMapper;



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

    public void saveOrderDetails(String key, TempOrderDetails orderDetails){
        try {
            String json = objectMapper.writeValueAsString(orderDetails);
            redisTemplate.opsForValue().set(key, json, 30, TimeUnit.MINUTES);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize TempOrderDetails record for Redis", e);
        } catch (Exception e) {
            log.error("Failed to save order details to Redis", e);
        }
    }

    public TempOrderDetails getOrderDetails(String key){
        try {
            Object value = redisTemplate.opsForValue().get(key);
            if (value == null) return null;

            return objectMapper.readValue(value.toString(), TempOrderDetails.class);
        } catch (JsonProcessingException e) {
            log.error("Failed to deserialize TempOrderDetails record from Redis", e);
            return null;
        } catch (Exception e) {
            log.error("Failed to retrieve order details from Redis", e);
            return null;
        }
    }

    public void deleteOrderDetails(String key){
        try {
            redisTemplate.delete(key);
        } catch (Exception e) {
            log.error("Failed to delete order details from Redis", e);
        }
    }


}


