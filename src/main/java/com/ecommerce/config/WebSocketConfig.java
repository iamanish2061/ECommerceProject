package com.ecommerce.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // 1. Enable a simple memory-based message broker
        // /topic is for broadcasting (everyone)
        // /queue is for private messages (specific user)
        config.enableSimpleBroker("/topic", "/queue");

        // 2. Prefix for messages sent from Client to Server
        config.setApplicationDestinationPrefixes("/app");

        // 3. Prefix for user-specific (private) destinations
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // This is the URL the frontend will connect to
        registry.addEndpoint("/ws-notifications")
                .setAllowedOriginPatterns("*") // In production, replace with your domain
                .withSockJS(); // Fallback for browsers that don't support WebSockets
    }
}



//frontend

//const socket = new SockJS('http://localhost:8080/ws-notifications');
//const stompClient = Stomp.over(socket);
//
//stompClient.connect({}, (frame) => {
//        // Subscribe to your own private queue
//        stompClient.subscribe('/user/queue/notifications', (notification) => {
//        const message = JSON.parse(notification.body);
//alert("New Notification: " + message.title);
//// Here you would update your React state/Redux/Badge count
//    });
//            });