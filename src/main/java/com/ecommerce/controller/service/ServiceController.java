package com.ecommerce.controller.service;

import com.ecommerce.controller.BaseController;
import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.service.ServiceDetailResponse;
import com.ecommerce.dto.response.service.ServiceListResponse;
import com.ecommerce.service.salon.SalonServiceService;
import com.ecommerce.validation.ValidId;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/services")
@RequiredArgsConstructor
@Validated
public class ServiceController extends BaseController {

    private final SalonServiceService salonServiceService;

    @GetMapping
    @Operation(summary = "to get all active services to list on user ui")
    public ResponseEntity<ApiResponse<List<ServiceListResponse>>> getAllActiveServices() {
        return success(salonServiceService.getAllActiveServices(), "Fetched active services successfully");
    }

    @GetMapping("/category/{category}")
    @Operation(summary = "to get service by category")
    public ResponseEntity<ApiResponse<List<ServiceListResponse>>> getServicesByCategory(
            @PathVariable String category
    ) {
        return success(salonServiceService.getServicesByCategory(category), "Fetched services of category: "+category);
    }

    @GetMapping("/search")
    @Operation(summary = "get all services that matches the searched query")
    public ResponseEntity<ApiResponse<List<ServiceListResponse>>> searchServices(
            @RequestParam String query
    ) {
        return success(salonServiceService.searchServices(query), "Fetched services related to search: : "+query);
    }

    @GetMapping("/{id}")
    @Operation(summary = "to fetch detail of one service that user clicks on")
    public ResponseEntity<ApiResponse<ServiceDetailResponse>> getServiceDetail(
            @ValidId @PathVariable Long id
    ) {
        return success(salonServiceService.getServiceDetail(id), "Fetched detail of service :"+id+" successfully!");
    }

    @GetMapping("/categories")
    @Operation(summary = "to fetch all categories")
    public ResponseEntity<ApiResponse<List<String>>> getAllCategories() {
        return success(salonServiceService.getAllCategories(), "Fetched all categories successfully");
    }
}
