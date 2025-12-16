package com.ecommerce.redis;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.StringRedisSerializer;

@Configuration
public class RedisConfig {

    @Bean
    public RedisTemplate redisTemplate(RedisConnectionFactory factory){
        RedisTemplate rT= new RedisTemplate<>();
        rT.setConnectionFactory(factory);

        rT.setKeySerializer(new StringRedisSerializer());
        rT.setValueSerializer(new StringRedisSerializer());

        return rT;
    }

}

