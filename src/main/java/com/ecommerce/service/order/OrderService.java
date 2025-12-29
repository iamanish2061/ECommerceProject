package com.ecommerce.service.order;

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
import com.ecommerce.model.address.AddressModel;
import com.ecommerce.model.address.AddressType;
import com.ecommerce.model.address.DeliveryAddress;
import com.ecommerce.model.cart.CartModel;
import com.ecommerce.model.order.OrderItem;
import com.ecommerce.model.order.OrderModel;
import com.ecommerce.model.order.OrderStatus;
import com.ecommerce.model.payment.PaymentMethod;
import com.ecommerce.model.product.ProductModel;
import com.ecommerce.model.user.UserModel;
import com.ecommerce.repository.address.AddressRepository;
import com.ecommerce.repository.cart.CartRepository;
import com.ecommerce.repository.order.OrderRepository;
import com.ecommerce.repository.product.ProductRepository;
import com.ecommerce.service.payment.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private final PaymentService paymentService;
    private final OrderPersistService orderPersistService;

    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
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

    @Transactional
    public PaymentRedirectResponse checkoutSingleProduct(UserModel user, Long productId, PlaceOrderRequest request) {
        ProductModel product = productRepository.findByIdForUpdate(productId).orElseThrow(
                ()->new ApplicationException("Product not found!", "PRODUCT_NOT_FOUND", HttpStatus.NOT_FOUND)
        );
        if(product.getStock()<1)
            throw new ApplicationException("Out of Stock!", "OUT_OF_STOCK", HttpStatus.NOT_FOUND);

        BigDecimal totalIncludingDeliveryCharge = product.getSellingPrice().add(BigDecimal.valueOf(request.deliveryCharge()));

        OrderItem item = OrderItem.builder()
                .quantity(1)
                .priceAtPurchase(product.getSellingPrice())
                .product(product)
                .build();

        DeliveryAddress address;
        if(request.type() == AddressType.OTHER){
            address = DeliveryAddress.builder()
                    .province(request.province())
                    .district(request.district())
                    .place(request.place())
                    .landmark(request.landmark())
                    .latitude(request.latitude())
                    .longitude(request.longitude())
                    .build();
        }
        else{
            AddressModel savedAddress = addressRepository.findByUserIdAndType(user.getId(), request.type())
                    .orElseThrow(()-> new ApplicationException(request.type()+" address not found!", "NOT_FOUND", HttpStatus.NOT_FOUND));
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
        orderModel.setUser(user);
        orderModel.setTotalAmount(totalIncludingDeliveryCharge);
        orderModel.setStatus(OrderStatus.PENDING);
        orderModel.setPhoneNumber(request.contactNumber());
        orderModel.addOrderItem(item);
        orderModel.setAddress(address);

        TempOrderDetails orderDetails = new TempOrderDetails(
                productId,
                null,
                null,
                orderModel
        );

        if(request.paymentMethod() == PaymentMethod.CASH_ON_DELIVERY) {
            String url = orderPersistService.executeSingleCodOrder(product, orderModel);
            return new PaymentRedirectResponse(
                    PaymentMethod.CASH_ON_DELIVERY,
                    url,
                    null
            );
        }
        else if (request.paymentMethod() == PaymentMethod.KHALTI) {
            String url = paymentService.payWithKhalti(orderDetails, totalIncludingDeliveryCharge);
            return new PaymentRedirectResponse(
                    PaymentMethod.KHALTI,
                    url,
                    null
            );
        }
        else if (request.paymentMethod() == PaymentMethod.ESEWA) {
            Esewa esewa= paymentService.payWithEsewa(orderDetails, totalIncludingDeliveryCharge);
            return new PaymentRedirectResponse(
                    PaymentMethod.ESEWA,
                    null,
                    esewa
            );
        }
        return null;
    }

    public PaymentRedirectResponse checkout(UserModel user, PlaceOrderRequest request) {
        List<CartModel> cartItems = cartRepository.findCartItemsByUserId(user.getId());
        if (cartItems.isEmpty()) {
            throw new ApplicationException("Cart is empty", "CART_EMPTY", HttpStatus.BAD_REQUEST);
        }

        List<Long> productIds = cartItems.stream()
                .map(item-> item.getProduct().getId())
                .toList();
        Map<Long, ProductModel> productsInCart = productRepository.findAllByIdIn(productIds)
                .stream()
                .collect(Collectors.toMap(ProductModel::getId, p->p));

        BigDecimal totalAmountFromCart = BigDecimal.ZERO;
//        calculating total and validating quantity

        OrderModel orderModel = new OrderModel();

        for(CartModel cart : cartItems){
            ProductModel product = productsInCart.get(cart.getProduct().getId());
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

            OrderItem item = OrderItem.builder()
                    .quantity(cart.getQuantity())
                    .priceAtPurchase(product.getSellingPrice())
                    .product(product)
                    .build();
            orderModel.addOrderItem(item);

            BigDecimal lineTotal = product.getSellingPrice()
                    .multiply(BigDecimal.valueOf(cart.getQuantity()));
            totalAmountFromCart = totalAmountFromCart.add(lineTotal);

        }
        BigDecimal totalIncludingDeliveryCharge =
                totalAmountFromCart.add(BigDecimal.valueOf(request.deliveryCharge()));

        DeliveryAddress address;
        if(request.type() == AddressType.OTHER){
            address = DeliveryAddress.builder()
                    .province(request.province())
                    .district(request.district())
                    .place(request.place())
                    .landmark(request.landmark())
                    .latitude(request.latitude())
                    .longitude(request.longitude())
                    .build();
        }
        else{
            AddressModel savedAddressModel = addressRepository.findByUserIdAndType(user.getId(), request.type())
                    .orElseThrow(()-> new ApplicationException(request.type()+" address not found!", "NOT_FOUND", HttpStatus.NOT_FOUND));
            address = DeliveryAddress.builder()
                    .province(savedAddressModel.getProvince())
                    .district(savedAddressModel.getDistrict())
                    .place(savedAddressModel.getPlace())
                    .landmark(savedAddressModel.getLandmark())
                    .latitude(savedAddressModel.getLatitude())
                    .longitude(savedAddressModel.getLongitude())
                    .build();
        }

        orderModel.setUser(user);
        orderModel.setTotalAmount(totalIncludingDeliveryCharge);
        orderModel.setStatus(OrderStatus.PENDING);
        orderModel.setPhoneNumber(request.contactNumber());
        orderModel.setAddress(address);


        TempOrderDetails orderDetails = new TempOrderDetails(
                0L,
                cartItems,
                productsInCart,
                orderModel
        );

        if(request.paymentMethod() == PaymentMethod.CASH_ON_DELIVERY) {
            String url = orderPersistService.executeCodOrder(cartItems, productsInCart, orderModel);
            return new PaymentRedirectResponse(
                    PaymentMethod.CASH_ON_DELIVERY,
                    url,
                    null
            );
        }
        else if (request.paymentMethod() == PaymentMethod.KHALTI) {
            String url = paymentService.payWithKhalti(orderDetails, totalIncludingDeliveryCharge);
            return new PaymentRedirectResponse(
                    PaymentMethod.KHALTI,
                    url,
                    null
            );
        }
        else if (request.paymentMethod() == PaymentMethod.ESEWA) {
            Esewa esewa= paymentService.payWithEsewa(orderDetails, totalIncludingDeliveryCharge);
            return new PaymentRedirectResponse(
                    PaymentMethod.ESEWA,
                    null,
                    esewa
            );
        }
        return null;
    }


}
