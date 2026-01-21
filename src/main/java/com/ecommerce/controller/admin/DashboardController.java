package com.ecommerce.controller.admin;

import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.admin.DashboardResponse;
import com.ecommerce.dto.response.appointment.AppointmentResponse;
import com.ecommerce.dto.response.order.OrderResponse;
import com.ecommerce.service.admin.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/stats")
    @Operation(summary = "to fetch the stats for dashboard")
    public ResponseEntity<ApiResponse<DashboardResponse>> getDashboardStats(){
        DashboardResponse response = dashboardService.getDashboardStats();
        return ResponseEntity.ok(ApiResponse.ok(response, "Stats fetch successfully"));
    }

    @GetMapping("/orders")
    @Operation(summary = "to fetch top 5 orders to list on admin dashboard")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getRecentOrders(){
        return ResponseEntity.ok(ApiResponse.ok(dashboardService.getRecentOrders(), "Fetched orders successfully"));
    }

    @GetMapping("/appointments")
    @Operation(summary = "to fetch top 5 appointments to list on admin dashboard")
    public ResponseEntity<ApiResponse<List<AppointmentResponse>>> getRecentAppointments(){
        return ResponseEntity.ok(ApiResponse.ok(dashboardService.getRecentAppointments(), "Fetched appointments successfully"));
    }

    @GetMapping("/forms")
    @Operation(summary = "to fetch forms to list on admin dashboard")
    public ResponseEntity<ApiResponse<List<?>>> getUnReadForms(){
        return ResponseEntity.ok(ApiResponse.ok(dashboardService.getUnreadForms(), "Fetched forms successfully"));
    }

}
