package com.ecommerce.service.order;

import com.ecommerce.dto.intermediate.TempOrderDetails;
import com.ecommerce.exception.ApplicationException;
import com.ecommerce.mapper.address.AddressMapper;
import com.ecommerce.mapper.order.OrderMapper;
import com.ecommerce.mapper.payment.PaymentMapper;
import com.ecommerce.model.activity.ActivityType;
import com.ecommerce.model.address.AddressModel;
import com.ecommerce.model.address.AddressType;
import com.ecommerce.model.address.DeliveryAddress;
import com.ecommerce.model.cart.CartModel;
import com.ecommerce.model.order.OrderItem;
import com.ecommerce.model.order.OrderModel;
import com.ecommerce.model.order.OrderStatus;
import com.ecommerce.model.payment.PaymentModel;
import com.ecommerce.model.payment.PaymentStatus;
import com.ecommerce.model.product.ProductModel;
import com.ecommerce.model.user.UserModel;
import com.ecommerce.redis.RedisService;
import com.ecommerce.repository.address.AddressRepository;
import com.ecommerce.repository.cart.CartRepository;
import com.ecommerce.repository.order.OrderRepository;
import com.ecommerce.repository.payment.PaymentRepository;
import com.ecommerce.repository.product.ProductRepository;
import com.ecommerce.repository.user.UserRepository;
import com.ecommerce.service.payment.PaymentService;
import com.ecommerce.service.recommendation.SimilarUserUpdater;
import com.ecommerce.service.recommendation.UserActivityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SuccessPaymentOrderService {

    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final AddressRepository addressRepository;
    private final CartRepository cartRepository;
    private final PaymentRepository paymentRepository;


    private final RedisService redisService;
    private final UserActivityService userActivityService;
    private final SimilarUserUpdater similarUserUpdater;

    @Transactional
    public void handleOrderDetails(boolean success, PaymentModel payment){
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

    private void handleSingleProductOrder(PaymentModel payment, TempOrderDetails orderDetails) {

        ProductModel product = productRepository.findById(orderDetails.productId()).orElseThrow(
                ()->new ApplicationException("Product not found!", "PRODUCT_NOT_FOUND", HttpStatus.NOT_FOUND)
        );
        UserModel user = userRepository.findById(orderDetails.userId()).orElseThrow(
                ()->new ApplicationException("User not found!", "USER_NOT_FOUND", HttpStatus.NOT_FOUND)
        );
        BigDecimal totalIncludingDeliveryCharge = product.getSellingPrice().add(BigDecimal.valueOf(orderDetails.request().deliveryCharge()));


        OrderItem item = OrderItem.builder()
                .quantity(1)
                .priceAtPurchase(product.getSellingPrice())
                .product(product)
                .build();

        DeliveryAddress address;
        if(orderDetails.request().type() == AddressType.OTHER){
            address = DeliveryAddress.builder()
                    .province(orderDetails.request().province())
                    .district(orderDetails.request().district())
                    .place(orderDetails.request().place())
                    .landmark(orderDetails.request().landmark())
                    .latitude(orderDetails.request().latitude())
                    .longitude(orderDetails.request().longitude())
                    .build();
        }
        else{
            AddressModel savedAddress = addressRepository.findByUserIdAndType(user.getId(), orderDetails.request().type())
                    .orElseThrow(()-> new ApplicationException(orderDetails.request().type()+" address not found!", "NOT_FOUND", HttpStatus.NOT_FOUND));
            address = DeliveryAddress.builder()
                    .province(savedAddress.getProvince())
                    .district(savedAddress.getDistrict())
                    .place(savedAddress.getPlace())
                    .landmark(savedAddress.getLandmark())
                    .latitude(savedAddress.getLatitude())
                    .longitude(savedAddress.getLongitude())
                    .build();
        }

        OrderModel orderModel = new OrderModel();
        orderModel.setTotalAmount(totalIncludingDeliveryCharge);
        if(payment.getPaymentStatus()== PaymentStatus.COMPLETE){
            orderModel.setStatus(OrderStatus.CONFIRMED);
        }else{
            orderModel.setStatus(OrderStatus.PENDING);
        }
        orderModel.setPhoneNumber(orderDetails.request().contactNumber());
        orderModel.addOrderItem(item);
        orderModel.setAddress(address);

        payment.setUser(user);
        orderModel.addPayment(payment);

        user.addProductsOrder(orderModel);
        product.setStock(product.getStock()-1);

        productRepository.save(product);
        userRepository.save(user);
        userActivityService.recordActivity(user.getId(), product.getId(), ActivityType.PURCHASE, 10);
        redisService.incrementUserVector(user.getId(), product.getId(), 10);
        similarUserUpdater.updateSimilarUsersAsync(user.getId());
    }

    private void handleCartOrders(PaymentModel payment, TempOrderDetails orderDetails) {

        UserModel user = userRepository.findById(orderDetails.userId()).orElseThrow(
                ()->new ApplicationException("User not found!", "USER_NOT_FOUND", HttpStatus.NOT_FOUND)
        );

        List<CartModel> cartItems = cartRepository.findCartItemsByUserId(user.getId());
        List<Long> productIds = cartItems.stream()
                .map(item-> item.getProduct().getId())
                .toList();
        Map<Long, ProductModel> productsInCart = productRepository.findAllByIdIn(productIds)
                .stream()
                .collect(Collectors.toMap(ProductModel::getId, p->p));

        BigDecimal totalAmountFromCart = BigDecimal.ZERO;
//        calculating total and validating quantity
        for(CartModel cart : cartItems){
            ProductModel product = productsInCart.get(cart.getProduct().getId());
            BigDecimal lineTotal = product.getSellingPrice()
                    .multiply(BigDecimal.valueOf(cart.getQuantity()));

            totalAmountFromCart = totalAmountFromCart.add(lineTotal);
        }
        BigDecimal totalIncludingDeliveryCharge =
                totalAmountFromCart.add(BigDecimal.valueOf(orderDetails.request().deliveryCharge()));


        OrderModel orderModel = new OrderModel();
        for (CartModel cart : cartItems) {
            ProductModel product = productsInCart.get(cart.getProduct().getId());

            OrderItem item = OrderItem.builder()
                    .quantity(cart.getQuantity())
                    .priceAtPurchase(product.getSellingPrice())
                    .product(product)
                    .build();
            orderModel.addOrderItem(item);

            product.setStock(product.getStock() - cart.getQuantity());

            userActivityService.recordActivity(
                    user.getId(),
                    product.getId(),
                    ActivityType.PURCHASE,
                    10
            );

            redisService.incrementUserVector(
                    user.getId(),
                    product.getId(),
                    10
            );
        }

        DeliveryAddress address;
        if(orderDetails.request().type() == AddressType.OTHER){
            address = DeliveryAddress.builder()
                    .province(orderDetails.request().province())
                    .district(orderDetails.request().district())
                    .place(orderDetails.request().place())
                    .landmark(orderDetails.request().landmark())
                    .latitude(orderDetails.request().latitude())
                    .longitude(orderDetails.request().longitude())
                    .build();
        }
        else{
            AddressModel savedAddress = addressRepository.findByUserIdAndType(user.getId(), orderDetails.request().type())
                    .orElseThrow(()-> new ApplicationException(orderDetails.request().type()+" address not found!", "NOT_FOUND", HttpStatus.NOT_FOUND));
            address = DeliveryAddress.builder()
                    .province(savedAddress.getProvince())
                    .district(savedAddress.getDistrict())
                    .place(savedAddress.getPlace())
                    .landmark(savedAddress.getLandmark())
                    .latitude(savedAddress.getLatitude())
                    .longitude(savedAddress.getLongitude())
                    .build();
        }

        orderModel.setTotalAmount(totalIncludingDeliveryCharge);
        if(payment.getPaymentStatus()== PaymentStatus.COMPLETE){
            orderModel.setStatus(OrderStatus.CONFIRMED);
        }else{
            orderModel.setStatus(OrderStatus.PENDING);
        }
        orderModel.setPhoneNumber(orderDetails.request().contactNumber());
        orderModel.setAddress(address);

        payment.setUser(user);
        orderModel.addPayment(payment);

        user.addProductsOrder(orderModel);

        productRepository.saveAll(productsInCart.values());
        userRepository.save(user);
        cartRepository.deleteAllByUserId(user.getId());
        similarUserUpdater.updateSimilarUsersAsync(user.getId());

    }

    @Transactional
    public void handleOrderDetails(boolean success, PaymentModel payment, String purchaseId){
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
