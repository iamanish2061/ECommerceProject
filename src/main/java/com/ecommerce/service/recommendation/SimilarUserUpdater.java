package com.ecommerce.service.recommendation;

import com.ecommerce.redis.RedisService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.concurrent.CompletableFuture;

@Component
@RequiredArgsConstructor
@Slf4j
public class SimilarUserUpdater {

    private final RedisTemplate<String, Object> redisTemplate;
    private final RedisService redisService;

    private static final int TOP_SIMILAR_USERS = 50;
    private static final double MIN_SIMILARITY = 0.3;

    @Async
    public CompletableFuture<Void> updateSimilarUsersAsync(Long changedUserId) {
        try {
            updateSimilarUsers(changedUserId);
        } catch (Exception e) {
            log.error("Failed to update similar users for {}", changedUserId, e);
        }
        return CompletableFuture.completedFuture(null);
    }

    public void updateSimilarUsers(Long changedUserId) {
        // 1. Get the target user's vector using our new service method
        Map<Object, Object> changedVector = redisService.getUserVector(changedUserId);
        if (changedVector.isEmpty()) return;

        // 2. Find all other users
        Set<String> allUserKeys = redisTemplate.keys("user_vector:*");

        Map<Long, Double> similarityScores = new HashMap<>();

        for (String key : allUserKeys) {
            // key format is "user_vector:ID"
            Long otherId = Long.parseLong(key.split(":")[1]);
            if (otherId.equals(changedUserId)) {
                continue;
            }
            // 3. Fetch the other user's vector
            Map<Object, Object> otherVector = redisService.getUserVector(otherId);

            // 4. Calculate similarity using the local maps (fast)
            double similarity = calculateCosine(changedVector, otherVector);

            if (similarity >= MIN_SIMILARITY) {
                similarityScores.put(otherId, similarity);
            }

        }
        // 5. Sort and get top matches
        List<Map.Entry<Long, Double>> top = similarityScores.entrySet().stream()
                .sorted(Map.Entry.<Long, Double>comparingByValue().reversed())
                .limit(TOP_SIMILAR_USERS)
                .toList();

        // 6. Save using redis method
        redisService.saveSimilarUsers(changedUserId, top);

        log.debug("Updated similar users for user {}: {} matches", changedUserId, top.size());
    }

    private double calculateCosine(Map<Object, Object> vec1, Map<Object, Object> vec2) {
        double dot = 0.0, norm1 = 0.0, norm2 = 0.0;

        // Collect all Product IDs involved from both users
        Set<Object> allPids = new HashSet<>(vec1.keySet());
        allPids.addAll(vec2.keySet());

        for (Object pid : allPids) {
            // With new serialization, these will be clean strings like "101"
            double score1 = Double.parseDouble(vec1.getOrDefault(pid, "0").toString());
            double score2 = Double.parseDouble(vec2.getOrDefault(pid, "0").toString());

            dot += score1 * score2;
            norm1 += score1 * score1;
            norm2 += score2 * score2;
        }

        return (norm1 == 0 || norm2 == 0) ? 0.0 : dot / (Math.sqrt(norm1) * Math.sqrt(norm2));
    }
}
