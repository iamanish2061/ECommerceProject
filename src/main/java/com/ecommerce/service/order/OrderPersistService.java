package com.ecommerce.service.order;

import com.ecommerce.dto.intermediate.OrderItemDTO;
import com.ecommerce.dto.intermediate.TempOrderDetails;
import com.ecommerce.exception.ApplicationException;
import com.ecommerce.mapper.payment.PaymentMapper;
import com.ecommerce.model.activity.ActivityType;
import com.ecommerce.model.notification.NotificationType;
import com.ecommerce.model.order.OrderItem;
import com.ecommerce.model.order.OrderModel;
import com.ecommerce.model.order.OrderStatus;
import com.ecommerce.model.payment.PaymentMethod;
import com.ecommerce.model.payment.PaymentModel;
import com.ecommerce.model.payment.PaymentStatus;
import com.ecommerce.model.product.ProductModel;
import com.ecommerce.model.user.UserModel;
import com.ecommerce.rabbitmq.dto.NotificationEvent;
import com.ecommerce.rabbitmq.producer.NotificationProducer;
import com.ecommerce.redis.RedisService;
import com.ecommerce.repository.cart.CartRepository;
import com.ecommerce.repository.order.OrderRepository;
import com.ecommerce.repository.payment.PaymentRepository;
import com.ecommerce.repository.product.ProductRepository;
import com.ecommerce.repository.user.UserRepository;
import com.ecommerce.service.recommendation.SimilarUserUpdater;
import com.ecommerce.service.recommendation.UserActivityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderPersistService {

    private final ProductRepository productRepository;
    private final CartRepository cartRepository;
    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    private final RedisService redisService;
    private final UserActivityService userActivityService;
    private final SimilarUserUpdater similarUserUpdater;
    private final NotificationProducer notificationProducer;

    private final PaymentMapper paymentMapper;

    public String executeSingleCodOrder(ProductModel product, UserModel user, TempOrderDetails tempOrder) {
        OrderModel orderToBePersisted = OrderModel.builder()
                .user(user)
                .totalAmount(tempOrder.totalIncludingDeliveryCharge())
                .status(OrderStatus.CONFIRMED)
                .phoneNumber(tempOrder.contactNumber())
                .address(tempOrder.address())
                .payment(null)
                .build();
        OrderItem orderItem = OrderItem.builder()
                .quantity(tempOrder.items().get(0).quantity())
                .priceAtPurchase(tempOrder.items().get(0).priceAtPurchase())
                .product(product)
                .build();
        orderToBePersisted.addOrderItem(orderItem);

        product.setStock(product.getStock()-1);
        productRepository.save(product);
        orderRepository.save(orderToBePersisted);

        userActivityService.recordActivity(user.getId(), product.getId(), ActivityType.PURCHASE, 10);
        redisService.incrementUserVector(user.getId(), product.getId(), 10);
        similarUserUpdater.updateSimilarUsersAsync(user.getId());

        NotificationEvent event = createEventForOrder(user, tempOrder, null);
        notificationProducer.send("notify.user", event);

        return null;
    }

    public String executeCodOrder(UserModel user, List<ProductModel> products, TempOrderDetails tempOrder) {
        Map<Long, OrderItemDTO> itemDtoMap = tempOrder.items().stream()
                .collect(Collectors.toMap(OrderItemDTO::productId, item -> item));

        OrderModel orderToBePersisted = OrderModel.builder()
                .user(user)
                .totalAmount(tempOrder.totalIncludingDeliveryCharge())
                .status(OrderStatus.CONFIRMED)
                .phoneNumber(tempOrder.contactNumber())
                .address(tempOrder.address())
                .payment(null)
                .build();

        for (ProductModel product : products) {
            OrderItemDTO dto = itemDtoMap.get(product.getId());

            if (product.getStock() < dto.quantity()) {
                throw new ApplicationException("Stock ran out for " + product.getTitle(), "OUT_OF_STOCK", HttpStatus.CONFLICT);
            }
            OrderItem orderItem = OrderItem.builder()
                    .quantity(dto.quantity())
                    .priceAtPurchase(dto.priceAtPurchase())
                    .product(product)
                    .build();

            orderToBePersisted.addOrderItem(orderItem);
            product.setStock(product.getStock() - dto.quantity());
            userActivityService.recordActivity(user.getId(), product.getId(), ActivityType.PURCHASE, 10);
            redisService.incrementUserVector(user.getId(), product.getId(), 10);
        }

        productRepository.saveAll(products);
        orderRepository.save(orderToBePersisted);

        cartRepository.deleteAllByUserId(user.getId());
        similarUserUpdater.updateSimilarUsersAsync(user.getId());

        NotificationEvent event = createEventForOrder(user, tempOrder, null);
        notificationProducer.send("notify.user", event);

        return null;
    }

    @Transactional
    public void handleEsewaOrderDetails(boolean success, PaymentModel payment){
        if(success){
            PaymentModel existingPayment = paymentRepository.findByTransactionId(payment.getTransactionId()).orElse(null);
            if(existingPayment != null){
                throw new ApplicationException("Payment already exists!", "PAYMENT_ALREADY_EXIST", HttpStatus.BAD_REQUEST);
            }
            TempOrderDetails orderDetails = redisService.getOrderDetails(payment.getTransactionId());
            if(orderDetails == null){
                throw new ApplicationException("Request time out!", "SESSION_TIMEOUT", HttpStatus.NOT_FOUND);
            }

            BigDecimal expected = orderDetails.totalIncludingDeliveryCharge().setScale(5, RoundingMode.HALF_UP);
            BigDecimal actual = payment.getAmount().setScale(5, RoundingMode.HALF_UP);

            if (expected.compareTo(actual) != 0) {
                throw new ApplicationException("Invalid Payment!", "INVALID_PAYMENT", HttpStatus.BAD_REQUEST);
            }

            if(orderDetails.productId() == 0L){
                handleCartOrders(payment, orderDetails);
            }else{
                handleSingleProductOrder(payment, orderDetails);
            }
        }
        if(payment != null){
            redisService.deleteOrderDetails(payment.getTransactionId());
        }

    }

    @Transactional
    public void handleKhaltiOrderDetails(boolean success, PaymentModel payment, String purchaseId){
        if(success){
            PaymentModel existingPayment = paymentRepository.findByTransactionId(payment.getTransactionId()).orElse(null);
            if(existingPayment != null){
                throw new ApplicationException("Payment already exists!", "PAYMENT_ALREADY_EXIST", HttpStatus.BAD_REQUEST);
            }
            TempOrderDetails orderDetails = redisService.getOrderDetails(purchaseId);
            if(orderDetails == null){
                throw new ApplicationException("Request time out!", "SESSION_TIMEOUT", HttpStatus.NOT_FOUND);
            }

            BigDecimal expected = orderDetails.totalIncludingDeliveryCharge().setScale(5, RoundingMode.HALF_UP);
            BigDecimal actual = payment.getAmount().setScale(5, RoundingMode.HALF_UP);

            if (expected.compareTo(actual) != 0) {
                throw new ApplicationException("Invalid Payment!", "INVALID_PAYMENT", HttpStatus.BAD_REQUEST);
            }
            if(orderDetails.productId() == 0L){
                handleCartOrders(payment, orderDetails);
            }else{
                handleSingleProductOrder(payment, orderDetails);
            }
        }
        redisService.deleteOrderDetails(purchaseId);

    }

    public void handleSingleProductOrder(PaymentModel payment, TempOrderDetails tempOrder) {
        ProductModel product= productRepository.findByIdForUpdate(tempOrder.productId())
                        .orElseThrow(()-> new ApplicationException("Product not found!", "PRODUCT NOT FOUND", HttpStatus.NOT_FOUND));
        UserModel user = userRepository.findById(tempOrder.userId())
                        .orElseThrow(()-> new ApplicationException("User not found!", "USER NOT FOUND", HttpStatus.NOT_FOUND));

        payment.setUser(user);
        OrderModel orderToBePersisted = OrderModel.builder()
                .user(user)
                .totalAmount(tempOrder.totalIncludingDeliveryCharge())
                .status(payment.getPaymentStatus() == PaymentStatus.COMPLETE ? OrderStatus.CONFIRMED: OrderStatus.PENDING)
                .phoneNumber(tempOrder.contactNumber())
                .address(tempOrder.address())
                .payment(payment)
                .build();
        OrderItem orderItem = OrderItem.builder()
                .quantity(tempOrder.items().get(0).quantity())
                .priceAtPurchase(tempOrder.items().get(0).priceAtPurchase())
                .product(product)
                .build();
        orderToBePersisted.addOrderItem(orderItem);

        product.setStock(product.getStock()-1);
        productRepository.save(product);
        orderRepository.save(orderToBePersisted);

        userActivityService.recordActivity(user.getId(), product.getId(), ActivityType.PURCHASE, 10);
        redisService.incrementUserVector(user.getId(), product.getId(), 10);
        similarUserUpdater.updateSimilarUsersAsync(user.getId());

        NotificationEvent event = createEventForOrder(user, tempOrder, payment);
        notificationProducer.send("notify.user", event);
    }

    public void handleCartOrders(PaymentModel payment, TempOrderDetails tempOrder) {
        UserModel user = userRepository.findById(tempOrder.userId())
                .orElseThrow(()-> new ApplicationException("User not found!", "USER NOT FOUND", HttpStatus.NOT_FOUND));

        List<Long> ids = tempOrder.items().stream().map(OrderItemDTO::productId).toList();
        List<ProductModel> products = productRepository.findAllByIdIn(ids);

        Map<Long, OrderItemDTO> itemDtoMap = tempOrder.items().stream()
                .collect(Collectors.toMap(OrderItemDTO::productId, item -> item));

        payment.setUser(user);
        OrderModel orderToBePersisted = OrderModel.builder()
                .user(user)
                .totalAmount(tempOrder.totalIncludingDeliveryCharge())
                .status(payment.getPaymentStatus() == PaymentStatus.COMPLETE ? OrderStatus.CONFIRMED : OrderStatus.PENDING)
                .phoneNumber(tempOrder.contactNumber())
                .address(tempOrder.address())
                .payment(payment)
                .build();

        for (ProductModel product : products) {
            OrderItemDTO dto = itemDtoMap.get(product.getId());

            if (product.getStock() < dto.quantity()) {
                throw new ApplicationException("Stock ran out for " + product.getTitle(), "OUT_OF_STOCK", HttpStatus.CONFLICT);
            }
            OrderItem orderItem = OrderItem.builder()
                    .quantity(dto.quantity())
                    .priceAtPurchase(dto.priceAtPurchase())
                    .product(product)
                    .build();

            orderToBePersisted.addOrderItem(orderItem);

            product.setStock(product.getStock() - dto.quantity());
            userActivityService.recordActivity(user.getId(), product.getId(), ActivityType.PURCHASE, 10);
            redisService.incrementUserVector(user.getId(), product.getId(), 10);
        }

        productRepository.saveAll(products);
        orderRepository.save(orderToBePersisted);

        cartRepository.deleteAllByUserId(user.getId());
        similarUserUpdater.updateSimilarUsersAsync(user.getId());

        NotificationEvent event = createEventForOrder(user, tempOrder, payment);
        notificationProducer.send("notify.user", event);
    }

    public NotificationEvent createEventForOrder(UserModel user, TempOrderDetails tempOrder, PaymentModel paymentModel){
        Map<String, Object> metaData = new HashMap<>();
        metaData.put("email" , user.getEmail());

        List<OrderItemDTO> itemSummary = new ArrayList<>(tempOrder.items());
        metaData.put("items", itemSummary);
        metaData.put("contactNumber", tempOrder.contactNumber());
        metaData.put("address", tempOrder.address().getDistrict() + ", " + tempOrder.address().getPlace()+", "+ tempOrder.address().getLandmark());
        metaData.put("totalAmount", tempOrder.totalIncludingDeliveryCharge());
        if(paymentModel == null){
            metaData.put("paymentMethod", PaymentMethod.CASH_ON_DELIVERY);
            metaData.put("transactionId", "-");
            metaData.put("paymentStatus", PaymentStatus.PENDING);
        }else{
            metaData.put("paymentMethod", paymentModel.getPaymentMethod());
            metaData.put("transactionId", paymentModel.getTransactionId());
            metaData.put("paymentStatus", paymentModel.getPaymentStatus());
        }
        metaData.put("adminMessage", "User "+user.getId()+" has placed an order!");

        return NotificationEvent.builder()
                .recipientId(user.getId())
                .title("Order placement")
                .message("Your order has been placed.")
                .type(NotificationType.ORDER_PLACED)
                .itemSummary(itemSummary)
                .metadata(metaData)
                .build();

    }

}


