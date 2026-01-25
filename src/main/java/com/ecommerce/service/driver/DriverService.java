package com.ecommerce.service.driver;

import com.ecommerce.dto.intermediate.TempOrderDetails;
import com.ecommerce.dto.request.order.OrderCompletionRequest;
import com.ecommerce.dto.response.order.AssignedDeliveryResponse;
import com.ecommerce.dto.response.user.DriverDashboardResponse;
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
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
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

    public DriverDashboardResponse getDriverInfo(UserModel user) {
        Driver driver = driverRepository.findById(user.getId()).orElseThrow(
                ()-> new ApplicationException("Driver not found", "DRIVER_NOT_FOUND", HttpStatus.NOT_FOUND)
        );
        return new DriverDashboardResponse(userMapper.mapEntityToDriverInfoResponse(driver), user.getUsername(), user.getProfileUrl(), user.getFullName());
    }

    @Transactional
    public void startDeliveryOf(UserModel driver, String username, Long orderId) {
        UserModel clientUser = userRepository.findByUsername(username).orElseThrow(
                () -> new ApplicationException("User not found!", "USER_NOT_FOUND", HttpStatus.NOT_FOUND)
        );
        OrderModel order = orderRepository.findById(orderId).orElseThrow(
                ()-> new ApplicationException("Order not found!", "NOT_FOUND", HttpStatus.NOT_FOUND)
        );
        order.setStatus(OrderStatus.SHIPPING);

        List<AssignedDeliveryResponse> updatedList = redisService.getDeliveryAddressList(driver.getId())
                .stream()
                .map(o->
                    Objects.equals(o.orderId(), orderId)?
                            new AssignedDeliveryResponse(
                                o.orderId(),
                                OrderStatus.SHIPPING,
                                o.username(),
                                o.phoneNumber(),
                                o.district(),
                                o.place(),
                                o.landmark(),
                                o.latitude(),
                                o.longitude()
                            ): o
                ).toList();

        redisService.addDeliveryAddressList(driver.getId(), updatedList);

        NotificationEvent event =EventHelper.createEventForStartingOrder(driver, clientUser);
        notificationProducer.send("notify.user", event);
    }

    public List<AssignedDeliveryResponse> getAssignedDelivery(Long driverId) {
        return redisService.getDeliveryAddressList(driverId);
    }

    @Transactional
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

        List<AssignedDeliveryResponse> remainingDeliveries = redisService.getDeliveryAddressList(driver.getId())
                .stream()
                .filter(o -> !Objects.equals(o.orderId(), request.orderId()))
                .toList();

        redisService.addDeliveryAddressList(driver.getId(), remainingDeliveries);

        NotificationEvent event =EventHelper.createEventForOrderCompletion(driver, clientUser);
        notificationProducer.send("notify.user", event);
    }


    public void completeAllDelivery(UserModel user) {
        List<AssignedDeliveryResponse> remainingList = redisService.getDeliveryAddressList(user.getId());
        if(remainingList.size()>2){
            throw new ApplicationException("Orders are still left to be delivered!", "INVALID_ACTION", HttpStatus.BAD_REQUEST);
        }
        redisService.deleteDeliveryAddressList(user.getId());
    }
}
