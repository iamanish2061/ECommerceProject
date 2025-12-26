package com.ecommerce.service.order;

import com.ecommerce.dto.request.order.PlaceOrderRequest;
import com.ecommerce.dto.response.order.OrderResponse;
import com.ecommerce.dto.response.order.UserOrderResponse;
import com.ecommerce.exception.ApplicationException;
import com.ecommerce.mapper.address.AddressMapper;
import com.ecommerce.mapper.order.OrderMapper;
import com.ecommerce.mapper.payment.PaymentMapper;
import com.ecommerce.model.cart.CartModel;
import com.ecommerce.model.order.OrderItem;
import com.ecommerce.model.order.OrderModel;
import com.ecommerce.model.order.OrderStatus;
import com.ecommerce.model.payment.PaymentMethod;
import com.ecommerce.model.product.ProductModel;
import com.ecommerce.model.user.AddressModel;
import com.ecommerce.model.user.AddressType;
import com.ecommerce.model.user.UserModel;
import com.ecommerce.repository.address.AddressRepository;
import com.ecommerce.repository.cart.CartRepository;
import com.ecommerce.repository.order.OrderRepository;
import com.ecommerce.repository.product.ProductRepository;
import com.ecommerce.repository.user.UserRepository;
import com.ecommerce.service.payment.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private final PaymentService paymentService;

    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final AddressRepository addressRepository;
    private final CartRepository cartRepository;

    private final OrderMapper orderMapper;
    private final AddressMapper addressMapper;
    private final PaymentMapper paymentMapper;

    public List<OrderResponse> getAllOrdersOf(UserModel user) {
        List<OrderModel> orders = orderRepository.findAllByUserId(user.getId());
        return orders.stream()
                .sorted(Comparator.comparing(OrderModel::getCreatedAt).reversed())
                .map(o->orderMapper.mapEntityToOrderResponse(o, user.getUsername()))
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
                paymentMapper.mapEntityToPaymentResponse(order.getPayment())
        );
    }

    public void checkoutSingleProduct(UserModel user, Long productId, PlaceOrderRequest request) {
        if(request.paymentMethod() == PaymentMethod.CASH_ON_DELIVERY){
            ProductModel product = productRepository.findById(productId).orElseThrow(
                    ()->new ApplicationException("Product not found!", "PRODUCT_NOT_FOUND", HttpStatus.NOT_FOUND)
            );
            OrderItem item = OrderItem.builder()
                    .quantity(1)
                    .priceAtPurchase(product.getSellingPrice())
                    .product(product)
                    .build();

            AddressModel savedAddressModel;

            if(request.type() == AddressType.OTHER){
                AddressModel addressModel = AddressModel.builder()
                        .user(user)
                        .type(AddressType.OTHER)
                        .province(request.province())
                        .district(request.district())
                        .place(request.place())
                        .landmark(request.landmark())
                        .latitude(request.latitude())
                        .longitude(request.longitude())
                        .build();
                savedAddressModel = addressRepository.save(addressModel);
            }else{
                savedAddressModel = addressRepository.findByUserIdAndType(user.getId(), request.type())
                        .orElseThrow(()-> new ApplicationException(request.type()+" address not found!", "NOT_FOUND", HttpStatus.NOT_FOUND));
            }

            OrderModel orderModel = new OrderModel();
            orderModel.setTotalAmount(product.getSellingPrice().add(BigDecimal.valueOf(request.deliveryCharge())));
            orderModel.setStatus(OrderStatus.PENDING);
            orderModel.setPhoneNumber(request.contactNumber());
            orderModel.addOrderItem(item);
            orderModel.setAddress(savedAddressModel);
            orderModel.setPayment(null);
            if(request.type() == AddressType.OTHER){
                user.getAddresses().add(savedAddressModel);
            }
            user.addProductsOrder(orderModel);

            userRepository.save(user);

        } else if (request.paymentMethod() == PaymentMethod.KHALTI) {
            paymentService.payWithKhalti(user, productId, request);
        } else if (request.paymentMethod() == PaymentMethod.ESEWA) {
            paymentService.payWithEsewa(user, productId, request);
        }
    }

    public void checkout(UserModel user, PlaceOrderRequest request) {

        if(request.paymentMethod() == PaymentMethod.CASH_ON_DELIVERY){
            OrderModel orderModel = new OrderModel();
            BigDecimal totalAmountFromCart = BigDecimal.ZERO;
            List<CartModel> cartItems = cartRepository.findCartItemsByUserId(user.getId());

            for(CartModel c: cartItems){
                ProductModel product = productRepository.findById(c.getProduct().getId()).orElseThrow(
                        ()->new ApplicationException("Product not found!", "PRODUCT_NOT_FOUND", HttpStatus.NOT_FOUND)
                );
                OrderItem item = OrderItem.builder()
                        .quantity(c.getQuantity())
                        .priceAtPurchase(product.getSellingPrice())
                        .product(product)
                        .build();
                BigDecimal total = product.getSellingPrice().multiply(BigDecimal.valueOf(c.getQuantity()));
                totalAmountFromCart = totalAmountFromCart.add(total);
                orderModel.addOrderItem(item);
            }

            AddressModel savedAddressModel;

            if(request.type() == AddressType.OTHER){
                AddressModel addressModel = AddressModel.builder()
                        .user(user)
                        .type(AddressType.OTHER)
                        .province(request.province())
                        .district(request.district())
                        .place(request.place())
                        .landmark(request.landmark())
                        .latitude(request.latitude())
                        .longitude(request.longitude())
                        .build();
                savedAddressModel = addressRepository.save(addressModel);
            }else{
                savedAddressModel = addressRepository.findByUserIdAndType(user.getId(), request.type())
                        .orElseThrow(()-> new ApplicationException(request.type()+" address not found!", "NOT_FOUND", HttpStatus.NOT_FOUND));
            }


            orderModel.setTotalAmount(totalAmountFromCart.add(BigDecimal.valueOf(request.deliveryCharge())));
            orderModel.setStatus(OrderStatus.PENDING);
            orderModel.setPhoneNumber(request.contactNumber());
            orderModel.setAddress(savedAddressModel);
            orderModel.setPayment(null);
            if(request.type() == AddressType.OTHER){
                user.getAddresses().add(savedAddressModel);
            }
            user.addProductsOrder(orderModel);

            userRepository.save(user);

        } else if (request.paymentMethod() == PaymentMethod.KHALTI) {
            paymentService.payWithKhalti(user, request);
        } else if (request.paymentMethod() == PaymentMethod.ESEWA) {
            paymentService.payWithEsewa(user, request);
        }
    }
}
