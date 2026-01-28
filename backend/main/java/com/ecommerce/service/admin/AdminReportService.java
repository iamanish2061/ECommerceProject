package com.ecommerce.service.admin;

import com.ecommerce.dto.response.report.SalesReportResponse;
import com.ecommerce.dto.response.report.StaffPerformanceReportResponse;
import com.ecommerce.dto.response.report.TopProductReportResponse;
import com.ecommerce.dto.response.report.TopServiceReportResponse;
import com.ecommerce.model.order.OrderModel;
import com.ecommerce.model.order.OrderStatus;
import com.ecommerce.repository.order.OrderRepository;
import com.ecommerce.repository.payment.PaymentRepository;
import com.ecommerce.repository.service.AppointmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AdminReportService {

    private final OrderRepository orderRepository;
    private final AppointmentRepository appointmentRepository;
    private final PaymentRepository paymentRepository;

    public SalesReportResponse getSalesData(String period) {
        List<String> labels = new ArrayList<>();
        List<Double> data = new ArrayList<>();

        if ("weekly".equalsIgnoreCase(period)) {
            LocalDate today = LocalDate.now();
            for (int i = 6; i >= 0; i--) {
                LocalDate date = today.minusDays(i);
                BigDecimal revenue = paymentRepository.getRevenueByDate(date);
                labels.add(date.getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.ENGLISH));
                data.add(revenue != null ? revenue.doubleValue() : 0.0);
            }
        } else {
            int year = LocalDate.now().getYear();
            for (int i = 1; i <= 12; i++) {
                BigDecimal revenue = paymentRepository.getRevenueByMonthAndYear(year, i);
                labels.add(LocalDate.of(year, i, 1).getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH));
                data.add(revenue != null ? revenue.doubleValue() : 0.0);
            }
        }

        return new SalesReportResponse(labels, data);
    }

    public List<TopProductReportResponse> getTopProducts() {
        // Fetch delivered orders with items and products using entity graph
        List<OrderModel> deliveredOrders = orderRepository.findByStatusIn(List.of(OrderStatus.DELIVERED, OrderStatus.INSTORE_COMPLETED));

        Map<Long, TopProductReportResponse> productStats = new HashMap<>();

        for (OrderModel order : deliveredOrders) {
            order.getOrderItems().forEach(item -> {
                Long productId = item.getProduct().getId();
                String productName = item.getProduct().getTitle();
                String category = item.getProduct().getCategory().getName();
                long quantity = item.getQuantity();
                BigDecimal revenue = item.getPriceAtPurchase().multiply(BigDecimal.valueOf(quantity));

                productStats.merge(productId,
                        new TopProductReportResponse(productId, productName, category, quantity, revenue),
                        (oldValue, newValue) -> new TopProductReportResponse(
                                productId, productName, category,
                                oldValue.sales() + newValue.sales(),
                                oldValue.revenue().add(newValue.revenue())));
            });
        }

        return productStats.values().stream()
                .sorted(Comparator.comparing(TopProductReportResponse::sales).reversed())
                .limit(5)
                .toList();
    }

    public List<TopServiceReportResponse> getTopServices() {
        return appointmentRepository.findTopBookedServices().stream()
                .limit(5)
                .toList();
    }

    public List<StaffPerformanceReportResponse> getStaffPerformance() {
        return appointmentRepository.findStaffPerformance();
    }

    public Map<String, BigDecimal> getRevenueOfCategory() {
        return Map.of("products", orderRepository.sumAmountByStatusIn(List.of(OrderStatus.DELIVERED, OrderStatus.INSTORE_COMPLETED)),
                "services", appointmentRepository.sumTotalAmount());
    }
}
