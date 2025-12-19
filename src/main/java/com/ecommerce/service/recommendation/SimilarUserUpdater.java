package com.ecommerce.service.recommendation;

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

    private final RedisTemplate<String, String> redisTemplate;
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
        String changedVectorKey = "user_vector:" + changedUserId;
        Map<Object, Object> changedVector = redisTemplate.opsForHash().entries(changedVectorKey);
        if (changedVector.isEmpty()) return;

        // Get all user vectors (still KEYS — but runs in background, not on request!)
        Set<String> allUserKeys = redisTemplate.keys("user_vector:*");
        Map<Long, Double> similarityScores = new HashMap<>();

        for (String key : allUserKeys) {
            if (key.equals(changedVectorKey)) continue;
            Long otherId = Long.parseLong(key.split(":")[1]);

            double similarity = cosineSimilarity(changedUserId, otherId);
            if (similarity >= MIN_SIMILARITY) {
                similarityScores.put(otherId, similarity);
            }
        }

        List<Map.Entry<Long, Double>> top = similarityScores.entrySet().stream()
                .sorted(Map.Entry.<Long, Double>comparingByValue().reversed())
                .limit(TOP_SIMILAR_USERS)
                .toList();

        // Write to Redis as ZSET
        String similarKey = "user_similar:" + changedUserId;
        redisTemplate.delete(similarKey);

        top.forEach(entry -> redisTemplate.opsForZSet()
                .add(similarKey, entry.getKey().toString(), entry.getValue()));

        log.debug("Updated similar users for user {}: {} matches", changedUserId, top.size());
    }

    private Double cosineSimilarity(Long user1, Long user2) {
        String key1 = "user_vector:" + user1;
        String key2 = "user_vector:" + user2;

        Map<Object, Object> vec1 = redisTemplate.opsForHash().entries(key1);
        Map<Object, Object> vec2 = redisTemplate.opsForHash().entries(key2);

        double dot = 0.0, norm1 = 0.0, norm2 = 0.0;
        Set<String> allPids = new HashSet<>();
        vec1.keySet().forEach(k-> allPids.add(k.toString()));
        vec2.keySet().forEach(k-> allPids.add(k.toString()));

        for (String pid: allPids) {
            double score1 = Double.parseDouble(vec1.getOrDefault(pid, "0").toString());
            double score2 = Double.parseDouble(vec2.getOrDefault(pid, "0").toString());

            dot += score1 * score2;
            norm1 += score1 * score1;
            norm2 += score2 * score2;
        }

        return (norm1 == 0 || norm2 == 0) ? 0.0 : dot / (Math.sqrt(norm1) * Math.sqrt(norm2));
    }
}
