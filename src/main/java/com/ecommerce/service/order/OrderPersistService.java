package com.ecommerce.service.order;

import com.ecommerce.dto.intermediate.TempOrderDetails;
import com.ecommerce.exception.ApplicationException;
import com.ecommerce.model.activity.ActivityType;
import com.ecommerce.model.cart.CartModel;
import com.ecommerce.model.order.OrderModel;
import com.ecommerce.model.order.OrderStatus;
import com.ecommerce.model.payment.PaymentModel;
import com.ecommerce.model.payment.PaymentStatus;
import com.ecommerce.model.product.ProductModel;
import com.ecommerce.redis.RedisService;
import com.ecommerce.repository.cart.CartRepository;
import com.ecommerce.repository.order.OrderRepository;
import com.ecommerce.repository.payment.PaymentRepository;
import com.ecommerce.repository.product.ProductRepository;
import com.ecommerce.service.recommendation.SimilarUserUpdater;
import com.ecommerce.service.recommendation.UserActivityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderPersistService {

    private final ProductRepository productRepository;
    private final CartRepository cartRepository;
    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;


    private final RedisService redisService;
    private final UserActivityService userActivityService;
    private final SimilarUserUpdater similarUserUpdater;

    @Transactional
    public String executeSingleCodOrder(ProductModel product, OrderModel order) {
        int newStock = product.getStock()-1;
        product.setStock(newStock);
        productRepository.save(product);

        order.setStatus(OrderStatus.CONFIRMED);
        order.setPayment(null);
        orderRepository.save(order);

        userActivityService.recordActivity(order.getUser().getId(), product.getId(), ActivityType.PURCHASE, 10);
        redisService.incrementUserVector(order.getUser().getId(), product.getId(), 10);
        similarUserUpdater.updateSimilarUsersAsync(order.getUser().getId());
        return null;
    }

    @Transactional
    public String executeCodOrder(List<CartModel> cartItems, Map<Long, ProductModel> products, OrderModel order){

        for(CartModel cart : cartItems){
            ProductModel product = products.get(cart.getProduct().getId());
            product.setStock(product.getStock()-cart.getQuantity());
            userActivityService.recordActivity(
                    order.getUser().getId(),
                    product.getId(),
                    ActivityType.PURCHASE,
                    10
            );

            redisService.incrementUserVector(
                    order.getUser().getId(),
                    product.getId(),
                    10
            );
        }
        productRepository.saveAll(products.values());

        order.setStatus(OrderStatus.CONFIRMED);
        order.setPayment(null);
        orderRepository.save(order);

        cartRepository.deleteAllByUserId(order.getUser().getId());
        similarUserUpdater.updateSimilarUsersAsync(order.getUser().getId());

        return null;
    }

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
    public void handleSingleProductOrder(PaymentModel payment, TempOrderDetails orderDetails) {
        OrderModel orderModel = orderDetails.order();

        ProductModel product= productRepository.findByIdForUpdate(orderDetails.productId())
                        .orElseThrow(()-> new ApplicationException("Product not found!", "PRODUCT NOT FOUND", HttpStatus.NOT_FOUND));

        product.setStock(product.getStock()-1);
        productRepository.save(product);

        payment.setUser(orderModel.getUser());
        if(payment.getPaymentStatus()== PaymentStatus.COMPLETE){
            orderModel.setStatus(OrderStatus.CONFIRMED);
        }else{
            orderModel.setStatus(OrderStatus.PENDING);
        }
        orderModel.addPayment(payment);
        orderRepository.save(orderModel);

        userActivityService.recordActivity(orderModel.getUser().getId(), product.getId(), ActivityType.PURCHASE, 10);
        redisService.incrementUserVector(orderModel.getUser().getId(), product.getId(), 10);
        similarUserUpdater.updateSimilarUsersAsync(orderModel.getUser().getId());
    }

    @Transactional
    public void handleCartOrders(PaymentModel payment, TempOrderDetails orderDetails) {
        OrderModel orderModel = orderDetails.order();
        List<CartModel> cartItems = orderDetails.cartItems();
        Map<Long, ProductModel> productsInCart = orderDetails.productsInCart();

//        calculating total and validating quantity
        for(CartModel cart : cartItems){
            ProductModel product = productsInCart.get(cart.getProduct().getId());
            product.setStock(product.getStock() - cart.getQuantity());

            userActivityService.recordActivity(
                    orderModel.getUser().getId(),
                    product.getId(),
                    ActivityType.PURCHASE,
                    10
            );

            redisService.incrementUserVector(
                    orderModel.getUser().getId(),
                    product.getId(),
                    10
            );
        }
        productRepository.saveAll(productsInCart.values());

        payment.setUser(orderModel.getUser());
        if(payment.getPaymentStatus()== PaymentStatus.COMPLETE){
            orderModel.setStatus(OrderStatus.CONFIRMED);
        }else{
            orderModel.setStatus(OrderStatus.PENDING);
        }
        orderModel.addPayment(payment);
        orderRepository.save(orderModel);


        cartRepository.deleteAllByUserId(orderModel.getUser().getId());
        similarUserUpdater.updateSimilarUsersAsync(orderModel.getUser().getId());
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

            if(orderDetails.productId() == 0L){
                handleCartOrders(payment, orderDetails);
            }else{
                handleSingleProductOrder(payment, orderDetails);
            }
        }
        redisService.deleteOrderDetails(purchaseId);

    }

}


