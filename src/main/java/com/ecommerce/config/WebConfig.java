package com.ecommerce.config;


import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/uploads/products/**")
                .addResourceLocations("file:uploads/products/");
        registry.addResourceHandler("/uploads/brands/**")
                .addResourceLocations("file:uploads/brands/");
        registry.addResourceHandler("/uploads/profile-picture/**")
                .addResourceLocations("file:uploads/profile-picture/");
    }
}