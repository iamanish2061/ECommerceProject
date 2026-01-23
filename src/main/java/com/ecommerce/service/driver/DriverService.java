package com.ecommerce.service.driver;

import com.ecommerce.dto.request.order.OrderCompletionRequest;
import com.ecommerce.dto.response.order.AssignedDeliveryResponse;
import com.ecommerce.dto.response.user.DriverInfoResponse;
import com.ecommerce.exception.ApplicationException;
import com.ecommerce.mapper.user.UserMapper;
import com.ecommerce.model.order.OrderModel;
import com.ecommerce.model.order.OrderStatus;
import com.ecommerce.model.payment.PaymentMethod;
import com.ecommerce.model.payment.PaymentModel;
import com.ecommerce.model.payment.PaymentStatus;
import com.ecommerce.model.user.Driver;
import com.ecommerce.model.user.UserModel;
import com.ecommerce.rabbitmq.dto.NotificationEvent;
import com.ecommerce.rabbitmq.producer.NotificationProducer;
import com.ecommerce.redis.RedisService;
import com.ecommerce.repository.order.OrderRepository;
import com.ecommerce.repository.user.DriverRepository;
import com.ecommerce.repository.user.UserRepository;
import com.ecommerce.utils.EventHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DriverService {

    private final DriverRepository driverRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;

    private final RedisService redisService;

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

        NotificationEvent event =EventHelper.createEventForStartingOrder(driver, clientUser);
        notificationProducer.send("notify.user", event);
    }

    public List<AssignedDeliveryResponse> getAssignedDelivery(Long driverId) {
        return redisService.getDeliveryAddressList(driverId);
//        updating all order status from confirmed to shipped
//        and also sending notification to multiple parties
    }

    public void completeDeliveryOf(UserModel driver, OrderCompletionRequest request) {
        UserModel clientUser = userRepository.findByUsername(request.username()).orElseThrow(
                () -> new ApplicationException("User not found!", "USER_NOT_FOUND", HttpStatus.NOT_FOUND)
        );
        OrderModel order = orderRepository.findDetailsOfOrderById(request.orderId()).orElseThrow(
                () -> new ApplicationException("Order not found!", "ORDER_NOT_FOUND", HttpStatus.NOT_FOUND)
        );

        if(order.getPayment() == null){
            PaymentModel payment = PaymentModel.builder()
                    .user(order.getUser())
                    .appointment(null)
                    .amount(order.getTotalAmount())
                    .transactionId("COD-"+UUID.randomUUID().toString())
                    .paymentMethod(PaymentMethod.CASH_ON_DELIVERY)
                    .paymentStatus(PaymentStatus.COMPLETE)
                    .paymentDate(LocalDateTime.now())
                    .errorCode(null)
                    .build();
            order.addPayment(payment);
        }

        order.setStatus(OrderStatus.DELIVERED);
        orderRepository.save(order);

        NotificationEvent event =EventHelper.createEventForOrderCompletion(driver, clientUser);
        notificationProducer.send("notify.user", event);
    }


}
