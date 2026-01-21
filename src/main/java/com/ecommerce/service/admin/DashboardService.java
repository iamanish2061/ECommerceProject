package com.ecommerce.service.admin;

import com.ecommerce.dto.response.admin.DashboardResponse;
import com.ecommerce.dto.response.appointment.AppointmentResponse;
import com.ecommerce.dto.response.order.OrderResponse;
import com.ecommerce.mapper.appointment.AppointmentMapper;
import com.ecommerce.mapper.order.OrderMapper;
import com.ecommerce.repository.order.OrderRepository;
import com.ecommerce.repository.payment.PaymentRepository;
import com.ecommerce.repository.product.ProductRepository;
import com.ecommerce.repository.review.ReviewRepository;
import com.ecommerce.repository.service.AppointmentRepository;
import com.ecommerce.repository.service.ServiceRepository;
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
    private final ServiceRepository serviceRepository;
    private final OrderRepository orderRepository;
    private final ReviewRepository reviewRepository;
    private final PaymentRepository paymentRepository;
    private final AppointmentRepository appointmentRepository;

    private final OrderMapper orderMapper;
    private final AppointmentMapper appointmentMapper;

//    since we have no review, service , appointment return 0 for now
    public DashboardResponse getDashboardStats() {
        Long totalUsers = userRepository.count();
        Long totalProducts = productRepository.count();
        Long totalServices = serviceRepository.count();
        Long totalOrders = orderRepository.count();
        Long totalReviews = reviewRepository.count();
        Long totalAppointments = appointmentRepository.count();
        BigDecimal totalPayment = paymentRepository.getTotalRevenue();
        return new DashboardResponse(
                totalUsers,
                totalProducts,
                totalServices,
                totalOrders,
                totalAppointments,
                totalReviews,
                totalPayment,
                totalPayment
        );
    }

    public List<OrderResponse> getRecentOrders() {
        return orderRepository.findTop5ByOrderByCreatedAtDesc().stream()
                .map(o-> orderMapper.mapEntityToOrderResponse(o, o.getUser().getUsername()))
                .toList();
    }

    public List<AppointmentResponse> getRecentAppointments() {
        return appointmentRepository.findTop5ByOrderByCreatedAtDesc().stream()
                .map(appointmentMapper::mapEntityToAppointmentResponse)
                .toList();
    }

    public List<?> getUnreadForms() {
        return new ArrayList<>();
    }
}
