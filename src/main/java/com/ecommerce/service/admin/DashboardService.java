package com.ecommerce.service.admin;

import com.ecommerce.dto.response.admin.DashboardResponse;
import com.ecommerce.mapper.order.OrderMapper;
import com.ecommerce.model.order.OrderModel;
import com.ecommerce.repository.order.OrderRepository;
import com.ecommerce.repository.payment.PaymentRepository;
import com.ecommerce.repository.product.ProductRepository;
import com.ecommerce.repository.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;

    private final OrderMapper orderMapper;

//    since we have no review, service , appointment return 0 for now
    public DashboardResponse getDashboardStats() {
        Long totalUsers = userRepository.count();
        Long totalProducts = productRepository.count();
        Long totalOrders = orderRepository.count();
        BigDecimal totalPayment = paymentRepository.getTotalRevenue();
        List<OrderModel> recentOrders = orderRepository.findTop5ByOrderByCreatedAtDesc();
        return new DashboardResponse(
                totalUsers,
                totalProducts,
                0L,
                totalOrders,
                0L,
                0L,
                totalPayment,
                totalPayment,
                recentOrders.stream()
                        .map(o-> orderMapper.mapEntityToOrderResponse(o, o.getUser().getUsername()))
                        .toList(),
                new ArrayList<>()
        );
    }
}
