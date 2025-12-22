package com.ecommerce.service.order;

import com.ecommerce.dto.request.product.BuyProductRequest;
import com.ecommerce.dto.response.order.OrderResponse;
import com.ecommerce.dto.response.order.UserOrderResponse;
import com.ecommerce.exception.ApplicationException;
import com.ecommerce.mapper.order.OrderMapper;
import com.ecommerce.model.order.OrderModel;
import com.ecommerce.model.product.ProductModel;
import com.ecommerce.model.user.UserModel;
import com.ecommerce.repository.order.OrderRepository;
import com.ecommerce.repository.product.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;

    private final OrderMapper orderMapper;

    public String buyProductNow(BuyProductRequest request) {
        ProductModel product = productRepository.findById(request.productId())
                .orElseThrow(()->
                        new ApplicationException("Product not found!", "PRODUCT_NOT_FOUND", HttpStatus.NOT_FOUND));
        OrderModel order = OrderModel.builder()
                .build();

        return "";
    }


    public List<OrderResponse> getAllOrdersOf(UserModel user) {
        List<OrderModel> orders = orderRepository.findAllByUserId(user.getId());
        return orders.stream()
                .sorted(Comparator.comparing(OrderModel::getCreatedAt).reversed())
                .map(o->orderMapper.mapEntityToOrderResponse(o,user.getUsername()))
                .toList();
    }

    public UserOrderResponse getDetailsOfOrder(Long orderId) {
        return new UserOrderResponse();
    }
}
