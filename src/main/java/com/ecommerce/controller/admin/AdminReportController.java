package com.ecommerce.controller.admin;

import com.ecommerce.controller.BaseController;
import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.report.SalesReportResponse;
import com.ecommerce.dto.response.report.StaffPerformanceReportResponse;
import com.ecommerce.dto.response.report.TopProductReportResponse;
import com.ecommerce.dto.response.report.TopServiceReportResponse;
import com.ecommerce.service.admin.AdminReportService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/reports")
@RequiredArgsConstructor
@Validated
public class AdminReportController extends BaseController {

    private final AdminReportService reportService;

    @GetMapping("/sales")
    @Operation(summary = "to fetch sales trend data (weekly or monthly)")
    public ResponseEntity<ApiResponse<SalesReportResponse>> getSalesData(
            @RequestParam(defaultValue = "weekly") String period) {
        return success(reportService.getSalesData(period), "Sales data fetched successfully");
    }

    @GetMapping("/sales-by-category")
    @Operation(summary = "to fetch total revenue from product and services")
    public ResponseEntity<ApiResponse<Map<String, BigDecimal>>> getRevenueOfCategory(){
        return success(reportService.getRevenueOfCategory(), "Fetched revenue by category");
    }

    @GetMapping("/top-products")
    @Operation(summary = "to fetch top selling products from delivered orders")
    public ResponseEntity<ApiResponse<List<TopProductReportResponse>>> getTopProducts() {
        return success(reportService.getTopProducts(), "Top products fetched successfully");
    }

    @GetMapping("/top-services")
    @Operation(summary = "to fetch most booked services")
    public ResponseEntity<ApiResponse<List<TopServiceReportResponse>>> getTopServices() {
        return success(reportService.getTopServices(), "Top services fetched successfully");
    }

    @GetMapping("/staff-performance")
    @Operation(summary = "to fetch staff performance reports")
    public ResponseEntity<ApiResponse<List<StaffPerformanceReportResponse>>> getStaffPerformance() {
        return success(reportService.getStaffPerformance(), "Staff performance fetched successfully");
    }
}
