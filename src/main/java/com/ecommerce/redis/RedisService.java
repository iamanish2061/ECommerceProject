package com.ecommerce.redis;

import com.ecommerce.dto.intermediate.TempOrderDetails;
import com.ecommerce.dto.response.order.AssignedDeliveryResponse;
import com.ecommerce.model.notification.Notification;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeUnit;

@RequiredArgsConstructor
@Service
public class RedisService {

    private static final Logger log = LoggerFactory.getLogger(RedisService.class);
    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;


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

//for incrementing user vector after any activity
    public void incrementUserVector(Long userId, Long productId, int score) {
        String key = "user_vector:" + userId;
        redisTemplate.opsForHash().increment(key, productId.toString(), score);
        redisTemplate.expire(key, 90, TimeUnit.DAYS);           // Optional: expire in 90 days if user inactive
    }

//    for updating viewed product
    public void updateViewedProduct(Long userId, Long productId){
        String viewedKey = "viewed:"+userId+":"+productId;
        boolean alreadyViewed = redisTemplate.hasKey(viewedKey);
        if(!alreadyViewed){
            incrementUserVector(userId, productId, 1);
            redisTemplate.opsForValue().set(viewedKey, "1", 48, TimeUnit.HOURS);
        }
    }

//    Get a user's interest vector safely
    public Map<Object, Object> getUserVector(Long userId) {
        return redisTemplate.opsForHash().entries("user_vector:" + userId);
    }

//    Save the calculated similarities as a Sorted Set
    public void saveSimilarUsers(Long userId, List<Map.Entry<Long, Double>> topSimilar) {
        String key = "user_similar:" + userId;
        redisTemplate.delete(key);
        topSimilar.forEach(entry ->
                redisTemplate.opsForZSet().add(key, entry.getKey().toString(), entry.getValue())
        );
    }

//    Get the IDs of similar users
    public Set<Object> getSimilarUserIds(Long userId) {
        // Fetches top 30 most similar users
        return redisTemplate.opsForZSet().reverseRange("user_similar:" + userId, 0, 29);
    }


//    temporary order service
//    for saving order details before redirecting to payment
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

//    for getting order details to store in db after successful payment
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

//    for deleting order details to store in db after successful payment
    public void deleteOrderDetails(String key){
        try {
            redisTemplate.delete(key);
        } catch (Exception e) {
            log.error("Failed to delete order details from Redis", e);
        }
    }


//    notification
//    Gets the current unread count.
    public Integer getUnreadCount(Long userId) {
        try {
            Object count = redisTemplate.opsForValue().get("unread_notifications:" + userId);
            return count != null ? Integer.parseInt(count.toString()) : 0;
        } catch (Exception e) {
            return 0;
        }
    }

//    Adds the full notification DTO to a Redis List for the user.
    public void addUnreadNotification(Long userId, Notification notification) {
        try {
            String key = "unread_list:" + userId;
            String json = objectMapper.writeValueAsString(notification);

            // Push to the front of the list (LPUSH) so newest are first
            redisTemplate.opsForList().leftPush(key, json);

            // Optional: Keep only the last 50 unread to save memory
            redisTemplate.opsForList().trim(key, 0, 49);

            log.info("Notification added to Redis list for user: {}", userId);
        } catch (Exception e) {
            log.error("Failed to cache unread notification", e);
        }
    }

//    Fetches all unread notification objects for the user icon.
    public List<Notification> getUnreadNotifications(Long userId) {
        String key = "unread_list:" + userId;
        List<Object> rawList = redisTemplate.opsForList().range(key, 0, -1);

        if (rawList == null) return List.of();

        return rawList.stream()
                .map(obj -> {
                    try {
                        return objectMapper.readValue(obj.toString(), Notification.class);
                    } catch (Exception e) {
                        return null;
                    }
                })
                .filter(java.util.Objects::nonNull)
                .toList();
    }

//    Removes a specific notification from the Redis list when marked as read.
    public void removeNotificationFromRedis(String userId, String notificationId) {
        String key = "unread_list:" + userId;
        List<Object> rawList = redisTemplate.opsForList().range(key, 0, -1);

        if (rawList != null) {
            for (Object obj : rawList) {
                if (obj.toString().contains(notificationId)) {
                    // Remove this specific JSON string from the list
                    redisTemplate.opsForList().remove(key, 1, obj);
                    break;
                }
            }
        }
    }

//    removes all notification of that user
    public void removeAllNotificationFromRedis(String userId){
        String key = "unread_list:" + userId;
        redisTemplate.delete(key);
    }

//   for adding delivery list to redis
    public void addDeliveryAddressList(Long driverId, List<AssignedDeliveryResponse> orderedList) {
        try {
            String key = "driver_route:" + driverId;
            String json = objectMapper.writeValueAsString(orderedList);
            // Store for 24 hours or until the delivery is completed
            redisTemplate.opsForValue().set(key, json, 24, TimeUnit.HOURS);
            log.info("Stored optimized route in Redis for driver: {}", driverId);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize delivery list for driver: {}", driverId, e);
        }
    }

//    get delivery address list
    public List<AssignedDeliveryResponse> getDeliveryAddressList(Long driverId) {
        try {
            String key = "driver_route:" + driverId;
            Object value = redisTemplate.opsForValue().get(key);
            if (value == null) return List.of();

            return objectMapper.readValue(value.toString(),
                    objectMapper.getTypeFactory().constructCollectionType(List.class, AssignedDeliveryResponse.class));
        } catch (Exception e) {
            log.error("Failed to retrieve delivery list from Redis", e);
            return List.of();
        }
    }

}



