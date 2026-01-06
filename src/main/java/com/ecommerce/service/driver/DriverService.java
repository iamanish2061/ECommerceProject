package com.ecommerce.service.driver;

import com.ecommerce.dto.request.order.OrderCompletionRequest;
import com.ecommerce.dto.response.order.AssignedDeliveryResponse;
import com.ecommerce.dto.response.user.DriverInfoResponse;
import com.ecommerce.exception.ApplicationException;
import com.ecommerce.mapper.user.UserMapper;
import com.ecommerce.model.order.OrderModel;
import com.ecommerce.model.order.OrderStatus;
import com.ecommerce.model.user.Driver;
import com.ecommerce.model.user.UserModel;
import com.ecommerce.rabbitmq.dto.NotificationEvent;
import com.ecommerce.rabbitmq.producer.NotificationProducer;
import com.ecommerce.repository.order.OrderRepository;
import com.ecommerce.repository.user.DriverRepository;
import com.ecommerce.repository.user.UserRepository;
import com.ecommerce.utils.EventHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DriverService {

    private final DriverRepository driverRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;

    private final UserMapper userMapper;
    private final NotificationProducer notificationProducer;

    public DriverInfoResponse getDriverInfo(UserModel user) {
        Driver driver = driverRepository.findById(user.getId()).orElseThrow(
                ()-> new ApplicationException("Driver not found", "DRIVER_NOT_FOUND", HttpStatus.NOT_FOUND)
        );
        return userMapper.mapEntityToDriverInfoResponse(driver);
    }

    public void startDeliveryOf(UserModel driver, String username) {
        UserModel clientUser = userRepository.findByUsername(username).orElseThrow(
                () -> new ApplicationException("User not found!", "USER_NOT_FOUND", HttpStatus.NOT_FOUND)
        );

        NotificationEvent event =EventHelper.createEventForStartingOrder(driver, clientUser.getId());
        notificationProducer.send("notify.user", event);
    }

    public List<AssignedDeliveryResponse> getAssignedDelivery(Long driverId) {
        System.out.println(driverId);
        return new ArrayList<>();
    }

    public void completeDeliveryOf(UserModel driver, OrderCompletionRequest request) {
        UserModel clientUser = userRepository.findByUsername(request.username()).orElseThrow(
                () -> new ApplicationException("User not found!", "USER_NOT_FOUND", HttpStatus.NOT_FOUND)
        );
        OrderModel order = orderRepository.findById(request.orderId()).orElseThrow(
                () -> new ApplicationException("Order not found!", "ORDER_NOT_FOUND", HttpStatus.NOT_FOUND)
        );
        order.setStatus(OrderStatus.DELIVERED);
        orderRepository.save(order);

        NotificationEvent event =EventHelper.createEventForStartingOrder(driver, clientUser.getId());
        notificationProducer.send("notify.user", event);
    }


}
