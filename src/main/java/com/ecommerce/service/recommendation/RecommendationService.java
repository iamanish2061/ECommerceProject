package com.ecommerce.service.recommendation;


import com.ecommerce.dto.response.product.BriefProductsResponse;
import com.ecommerce.mapper.product.ProductMapper;
import com.ecommerce.redis.RedisService;
import com.ecommerce.repository.product.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class RecommendationService  {

    private final ProductRepository productRepository;
    private final RedisService redisService;
    private final ProductMapper productMapper;

    private static final int RECOMMENDATION_COUNT =15;

    public List<BriefProductsResponse> getPersonalizedRecommendation(Long userId) {
        // 1. Get the current user's vector to know what they've already seen
        Map<Object, Object> userVector = redisService.getUserVector(userId);
        if (userVector.isEmpty()) {
            return new ArrayList<>();
        }

        // 2. Fetch IDs of similar users (Neighbors) from our ZSET
        Set<Object> similarUserIds = redisService.getSimilarUserIds(userId);
        if (similarUserIds == null || similarUserIds.isEmpty()) {
            return new ArrayList<>();
        }

        // 3. Aggregate product scores from those similar users
        Map<Long, Double> productScores = new HashMap<>();

        for (Object simUserIdObj : similarUserIds) {
            Long simUserId = Long.parseLong(simUserIdObj.toString());
            Map<Object, Object> neighborVector = redisService.getUserVector(simUserId);

            neighborVector.forEach((pid, score) -> {
                // Ensure we handle the PID as a clean string/long
                String productIdStr = pid.toString();

                // SKIP if the current user has already interacted with this product
                if (userVector.containsKey(productIdStr)) return;

                Long productId = Long.parseLong(productIdStr);
                double productScore = Double.parseDouble(score.toString());

                // Add score to the map; if product exists, sum the scores
                productScores.merge(productId, productScore, Double::sum);
            });
        }

        // 4. Sort products by score (highest first) and take the top 15
        List<Long> recommendedIds = productScores.entrySet().stream()
                .sorted(Map.Entry.<Long, Double>comparingByValue().reversed())
                .limit(RECOMMENDATION_COUNT)
                .map(Map.Entry::getKey)
                .toList();

        if (recommendedIds.isEmpty()) {
            return new ArrayList<>();
        }

        // 5. Fetch product details from DB and map to Response DTO
        return productRepository.findAllByIdIn(recommendedIds).stream()
                .map(productMapper::mapEntityToBriefProductsResponse)
                .toList();
    }

}




