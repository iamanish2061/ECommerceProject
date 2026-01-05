package com.ecommerce.dto.response.admin;

import com.ecommerce.dto.response.appointment.AppointmentResponse;
import com.ecommerce.dto.response.order.OrderResponse;

import java.math.BigDecimal;
import java.util.List;

public record DashboardResponse(
        Long totalUsers,
        Long totalProducts,
        Long totalServices,
        Long totalOrders,
        Long totalAppointments,
        Long totalReviews,
        BigDecimal totalSales,
        BigDecimal totalPayments,
        List<OrderResponse> latestOrders,
        List<AppointmentResponse> latestAppointments
) {
}
