package com.ecommerce.service.order;

import com.ecommerce.dto.intermediate.OrderItemDTO;
import com.ecommerce.dto.intermediate.TempOrderDetails;
import com.ecommerce.dto.request.order.PlaceOrderRequest;
import com.ecommerce.dto.response.order.OrderResponse;
import com.ecommerce.dto.response.order.UserOrderResponse;
import com.ecommerce.dto.response.payment.PaymentRedirectResponse;
import com.ecommerce.esewa.Esewa;
import com.ecommerce.exception.ApplicationException;
import com.ecommerce.mapper.address.AddressMapper;
import com.ecommerce.mapper.order.OrderMapper;
import com.ecommerce.mapper.payment.PaymentMapper;
import com.ecommerce.model.cart.CartModel;
import com.ecommerce.model.order.OrderModel;
import com.ecommerce.model.order.OrderStatus;
import com.ecommerce.model.payment.PaymentMethod;
import com.ecommerce.model.product.ProductModel;
import com.ecommerce.model.user.UserModel;
import com.ecommerce.rabbitmq.dto.NotificationEvent;
import com.ecommerce.rabbitmq.producer.NotificationProducer;
import com.ecommerce.repository.cart.CartRepository;
import com.ecommerce.repository.order.OrderRepository;
import com.ecommerce.repository.product.ProductRepository;
import com.ecommerce.service.payment.PaymentService;
import com.ecommerce.utils.EventHelper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private final PaymentService paymentService;
    private final OrderPersistService orderPersistService;

    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;

    private final OrderMapper orderMapper;
    private final AddressMapper addressMapper;
    private final PaymentMapper paymentMapper;

    private final NotificationProducer notificationProducer;

    public List<OrderResponse> getAllOrdersOf(UserModel user) {
        List<OrderModel> orders = orderRepository.findAllByUserId(user.getId());
        return orders.stream()
                .sorted(Comparator.comparing(OrderModel::getCreatedAt).reversed())
                .map(o->orderMapper.mapEntityToOrderResponse(o, user.getUsername()))
                .toList();
    }

    public List<OrderResponse> getRecentOrdersOf(UserModel user) {
        List<OrderModel> orders = orderRepository.findAllByUserId(user.getId());
        return orders.stream()
                .sorted(Comparator.comparing(OrderModel::getCreatedAt).reversed())
                .map(o-> orderMapper.mapEntityToOrderResponse(o, user.getUsername()))
                .limit(3)
                .toList();
    }

    public UserOrderResponse getDetailsOfOrder(Long orderId) {
        OrderModel order = orderRepository.findOrderOfUserInDetail(orderId)
                .orElseThrow(()-> new ApplicationException("Order not found!", "ORDER_NOT_FOUND", HttpStatus.NOT_FOUND));

        return new UserOrderResponse(
                order.getId(),
                order.getTotalAmount(),
                order.getStatus(),
                order.getCreatedAt(),
                order.getOrderItems().stream()
                        .map(orderMapper::mapEntityToOrderItemResponse).toList(),
                addressMapper.mapEntityToAddressResponse(order.getAddress()),
                paymentMapper.mapEntityToPaymentResponse(order.getPayment()),
                order.getPhoneNumber()
        );
    }

    @Transactional
    public PaymentRedirectResponse checkoutSingleProduct(UserModel user, Long productId, PlaceOrderRequest request) {
        ProductModel product = productRepository.findByIdForUpdate(productId).orElseThrow(
                ()->new ApplicationException("Product not found!", "PRODUCT_NOT_FOUND", HttpStatus.NOT_FOUND)
        );
        if(product.getStock()<1)
            throw new ApplicationException("Out of Stock!", "OUT_OF_STOCK", HttpStatus.NOT_FOUND);

        BigDecimal totalIncludingDeliveryCharge = product.getSellingPrice().add(request.deliveryCharge());

        TempOrderDetails tempOrder = new TempOrderDetails(
                productId,
                List.of(new OrderItemDTO(productId, 1, product.getSellingPrice())),
                user.getId(),
                addressMapper.mapRequestToDeliveryAddress(request),
                request.deliveryCharge(),
                request.contactNumber(),
                totalIncludingDeliveryCharge
        );

        if(request.paymentMethod() == PaymentMethod.CASH_ON_DELIVERY) {
            String url = orderPersistService.executeSingleCodOrder(product, user, tempOrder);
            return new PaymentRedirectResponse(
                    PaymentMethod.CASH_ON_DELIVERY,
                    url,
                    null
            );
        }
        else if (request.paymentMethod() == PaymentMethod.KHALTI) {
            String url = paymentService.payWithKhalti(tempOrder);
            return new PaymentRedirectResponse(
                    PaymentMethod.KHALTI,
                    url,
                    null
            );
        }
        else if (request.paymentMethod() == PaymentMethod.ESEWA) {
            Esewa esewa= paymentService.payWithEsewa(tempOrder);
            return new PaymentRedirectResponse(
                    PaymentMethod.ESEWA,
                    null,
                    esewa
            );
        }
        return null;
    }

    @Transactional
    public PaymentRedirectResponse checkout(UserModel user, PlaceOrderRequest request) {
        List<CartModel> cartItems = cartRepository.findCartItemsByUserId(user.getId());
        if (cartItems.isEmpty()) {
            throw new ApplicationException("Cart is empty", "CART_EMPTY", HttpStatus.BAD_REQUEST);
        }

        List<OrderItemDTO> items = new ArrayList<>();
        for(CartModel cart : cartItems) {
            ProductModel product = cart.getProduct();
            if (product == null) {
                throw new ApplicationException(
                        "Product not found",
                        "PRODUCT_NOT_FOUND",
                        HttpStatus.NOT_FOUND
                );
            }
            if (product.getStock() < cart.getQuantity()) {
                throw new ApplicationException(
                        "Not enough stock for product: " + product.getTitle(),
                        "NOT_ENOUGH_STOCK",
                        HttpStatus.BAD_REQUEST
                );
            }
            items.add(new OrderItemDTO(
                    cart.getProduct().getId(),
                    cart.getQuantity(),
                    cart.getProduct().getSellingPrice()
            ));
        }

        BigDecimal totalAmountFromCart = items.stream()
                .map(item -> item.priceAtPurchase().multiply(BigDecimal.valueOf(item.quantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalIncludingDeliveryCharge = totalAmountFromCart.add(request.deliveryCharge());

        TempOrderDetails tempOrder = new TempOrderDetails(
                0L,
                items,
                user.getId(),
                addressMapper.mapRequestToDeliveryAddress(request),
                request.deliveryCharge(),
                request.contactNumber(),
                totalIncludingDeliveryCharge
        );

        if(request.paymentMethod() == PaymentMethod.CASH_ON_DELIVERY) {
            List<Long> ids = items.stream().map(OrderItemDTO::productId).toList();
            List<ProductModel> products = productRepository.findAllByIdIn(ids);
            String url = orderPersistService.executeCodOrder(user, products, tempOrder);
            return new PaymentRedirectResponse(
                    PaymentMethod.CASH_ON_DELIVERY,
                    url,
                    null
            );
        }
        else if (request.paymentMethod() == PaymentMethod.KHALTI) {
            String url = paymentService.payWithKhalti(tempOrder);
            return new PaymentRedirectResponse(
                    PaymentMethod.KHALTI,
                    url,
                    null
            );
        }
        else if (request.paymentMethod() == PaymentMethod.ESEWA) {
            Esewa esewa= paymentService.payWithEsewa(tempOrder);
            return new PaymentRedirectResponse(
                    PaymentMethod.ESEWA,
                    null,
                    esewa
            );
        }
        return null;
    }

    @Transactional
    public void cancelOrder(UserModel user, Long orderId) {
        OrderModel order = orderRepository.findById(orderId).orElseThrow(
                () -> new ApplicationException("Order not found!", "ORDER_NOT_FOUND", HttpStatus.NOT_FOUND)
        );
        order.setStatus(OrderStatus.CANCELLED);
        orderRepository.save(order);
        NotificationEvent event = EventHelper.createEventForOrderCanncellation(user, order);
        notificationProducer.send("notify.user", event);
    }
}
