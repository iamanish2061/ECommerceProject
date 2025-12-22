package com.ecommerce.service.order;


import com.ecommerce.dto.request.product.SellProductRequests;
import com.ecommerce.dto.response.order.OrderResponse;
import com.ecommerce.dto.response.order.SingleOrderResponse;
import com.ecommerce.exception.ApplicationException;
import com.ecommerce.mapper.address.AddressMapper;
import com.ecommerce.mapper.order.OrderMapper;
import com.ecommerce.mapper.payment.PaymentMapper;
import com.ecommerce.mapper.user.UserMapper;
import com.ecommerce.model.order.OrderItem;
import com.ecommerce.model.order.OrderModel;
import com.ecommerce.model.order.OrderStatus;
import com.ecommerce.model.payment.PaymentMethod;
import com.ecommerce.model.payment.PaymentModel;
import com.ecommerce.model.payment.PaymentStatus;
import com.ecommerce.model.product.ProductModel;
import com.ecommerce.model.user.UserModel;
import com.ecommerce.repository.order.OrderRepository;
import com.ecommerce.repository.product.ProductRepository;
import com.ecommerce.utils.HelperClass;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;

@RequiredArgsConstructor
@Service
public class AdminOrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;

    private final OrderMapper orderMapper;
    private final UserMapper userMapper;
    private final PaymentMapper paymentMapper;
    private final AddressMapper addressMapper;

    @Transactional
    public String sellProducts(List<SellProductRequests> requests, UserModel admin) {

        BigDecimal totalAmount = BigDecimal.ZERO;

        OrderModel order = new OrderModel();
        for(SellProductRequests request: requests){
            ProductModel product = productRepository.findById(request.productId())
                    .orElseThrow(()->new ApplicationException("Product not found!", "PRODUCT_NOT_FOUND", HttpStatus.NOT_FOUND));
            if (product.getStock() < request.quantity()) {
                throw new ApplicationException("Insufficient stock for " + product.getTitle(),
                        "INSUFFICIENT_STOCK", HttpStatus.BAD_REQUEST);
            }
            product.setStock(product.getStock() - request.quantity());

            order.addOrderItem(
                    OrderItem.builder()
                            .quantity(request.quantity())
                            .priceAtPurchase(product.getSellingPrice())
                            .product(product)
                            .build());
            BigDecimal total = product.getSellingPrice().multiply(BigDecimal.valueOf(request.quantity()));
            totalAmount = totalAmount.add(total);
        }

        order.setTotalAmount(totalAmount);
        order.setStatus(OrderStatus.INSTORE_COMPLETED);
        order.setAddress(null);
        order.addPayment(PaymentModel.builder()
                .user(admin)
                .amount(totalAmount)
                .transactionId(HelperClass.generateTransactionIdForInStoreOperation())
                .paymentMethod(PaymentMethod.INSTORE_CASH)
                .paymentStatus(PaymentStatus.SUCCESS)
                .build());
        admin.addProductsOrder(order);

        orderRepository.save(order);

        return "Transaction successful";
    }

    public List<OrderResponse> getAllOrders() {
        List<OrderModel> allOrders = orderRepository.findAllOrdersWithUsername();
        if(allOrders.isEmpty())
            throw new ApplicationException("No order is placed yet!", "ORDER_NOT_FOUND", HttpStatus.NOT_FOUND);
        return allOrders.stream()
                .sorted(Comparator.comparing(OrderModel::getCreatedAt).reversed())
                .map(orderModel ->
                orderMapper.mapEntityToOrderResponse(orderModel, orderModel.getUser().getUsername()))
                .toList();
    }

    public List<String> getStatusList() {
        return Arrays.asList("PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED");
    }

    public List<OrderResponse> getOrderOfUser(Long userId) {
        List<OrderModel> ordersOfUser = orderRepository.findByUserId(userId);
        if(ordersOfUser == null){
            throw new ApplicationException("Order not found!", "ORDER_NOT_FOUND", HttpStatus.NOT_FOUND);
        }
        return ordersOfUser.stream()
                .map(order-> orderMapper.mapEntityToOrderResponse(order, order.getUser().getUsername()))
                .toList();
    }

    public SingleOrderResponse getDetailOfOrder(Long orderId) {
        OrderModel order = orderRepository.findDetailsOfOrderById(orderId)
                .orElseThrow(()->new ApplicationException("Order not found!", "ORDER_NOT_FOUND", HttpStatus.NOT_FOUND));

        return new SingleOrderResponse(
                order.getId(),
                userMapper.mapEntityToUserResponse(order.getUser()),
                order.getTotalAmount(),
                order.getStatus(),
                order.getCreatedAt(),
                order.getOrderItems().stream()
                        .map(orderMapper::mapEntityToOrderItemResponse).toList(),
                addressMapper.mapEntityToAddressResponse(order.getAddress()),
                paymentMapper.mapEntityToPaymentResponse(order.getPayment())
        );
    }

    @Transactional
    public void updateOrderStatus(Long orderId, OrderStatus status) {
        OrderModel orderModel = orderRepository.findById(orderId)
                .orElseThrow(()->
                        new ApplicationException("Order not found!", "ORDER_NOT_FOUND", HttpStatus.NOT_FOUND));

        orderModel.setStatus(status);
        orderRepository.save(orderModel);
    }

}