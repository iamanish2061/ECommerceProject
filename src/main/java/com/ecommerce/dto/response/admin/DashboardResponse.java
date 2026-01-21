package com.ecommerce.dto.response.admin;

import java.math.BigDecimal;

public record DashboardResponse(
        Long totalUsers,
        Long totalProducts,
        Long totalServices,
        Long totalOrders,
        Long totalAppointments,
        Long totalReviews,
        BigDecimal totalSales,
        BigDecimal totalPayments
) {
}
