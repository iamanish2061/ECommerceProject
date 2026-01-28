package com.ecommerce.redis;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.StringRedisSerializer;

@Configuration
public class RedisConfig {

    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory factory) {
        RedisTemplate<String, Object> rT = new RedisTemplate<>();
        rT.setConnectionFactory(factory);

        StringRedisSerializer stringSerializer = new StringRedisSerializer();

        // 1. Regular Key/Value (for viewed products, codes, etc.)
        rT.setKeySerializer(stringSerializer);
        rT.setValueSerializer(stringSerializer);

        // 2. Hash Key/Value (CRITICAL for user_vector and similar_user logic)
        rT.setHashKeySerializer(stringSerializer);
        rT.setHashValueSerializer(stringSerializer);

        rT.afterPropertiesSet();
        return rT;
    }
}

