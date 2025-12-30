package com.ecommerce.service.recommendation;


import com.ecommerce.dto.response.product.BriefProductsResponse;
import com.ecommerce.mapper.product.ProductMapper;
import com.ecommerce.model.product.ProductModel;
import com.ecommerce.repository.product.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class RecommendationService  {

    private final ProductRepository productRepository;
    private final RedisTemplate<String, String> redisTemplate;

    private final ProductMapper productMapper;

    private static final int RECOMMENDATION_COUNT =15;

    public List<BriefProductsResponse> getPersonalizedRecommendation(Long userId){
        List<BriefProductsResponse> recommendationProducts;
        String vectorKey = "user_vector:" + userId;

        Long size = redisTemplate.opsForHash().size(vectorKey);
        if(size == null || size == 0){
            return new ArrayList<>();
        }

        Set<Object> userProductIds = redisTemplate.opsForHash().keys(vectorKey);

        Set<String> similarUserIdStrings = redisTemplate.opsForZSet()
                .reverseRange("user_similar:"+userId, 0,29);

        List<Long> similarUserIds = similarUserIdStrings ==null ?
                new ArrayList<>(): similarUserIdStrings.stream()
                .map(Long::parseLong)
                .toList();

        // Aggregate products from similar users (exclude already interacted)
        Map<String, Double> productScores = new HashMap<>();
        for (Long simUserId : similarUserIds) {
            Map<Object, Object> map = redisTemplate.opsForHash().entries("user_vector:" + simUserId);
            map.forEach((pid, score) -> {
                String productIdStr = pid.toString();
                if (userProductIds.contains(productIdStr)) return; // skip already seen
                productScores.merge(productIdStr, Double.valueOf(score.toString()), Double::sum);
            });
        }

        List<Long> recommendedIds = productScores.entrySet().stream()
                .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
                .limit(RECOMMENDATION_COUNT)
                .map(e -> Long.parseLong(e.getKey()))
                .toList();


        List<ProductModel> unfilteredProducts = productRepository.findAllByIdIn(recommendedIds);

        recommendationProducts = unfilteredProducts.stream()
                        .map(productMapper::mapEntityToBriefProductsResponse)
                .toList();

        return recommendationProducts;

    }

}

