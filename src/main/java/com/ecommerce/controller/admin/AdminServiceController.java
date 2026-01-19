package com.ecommerce.controller.admin;

import com.ecommerce.dto.request.service.AssignStaffToServiceRequest;
import com.ecommerce.dto.request.service.ServiceCreateRequest;
import com.ecommerce.dto.request.service.ServiceUpdateRequest;
import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.service.ServiceDetailResponse;
import com.ecommerce.dto.response.service.ServiceListResponse;
import com.ecommerce.dto.response.service.ServiceNameAndIdResponse;
import com.ecommerce.dto.response.staff.NameAndIdOfStaffResponse;
import com.ecommerce.service.salon.SalonServiceService;
import com.ecommerce.validation.ValidId;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/admin/services")
@RequiredArgsConstructor
@Validated
//@PreAuthorize("hasRole('ADMIN')")
public class AdminServiceController {

    private final SalonServiceService salonServiceService;

    @GetMapping("/name-and-id")
    @Operation(summary = "to fetch name and id of staff for dropdown in adding staff to specific service form")
    public ResponseEntity<ApiResponse<List<ServiceNameAndIdResponse>>> getNameAndIdOfServices(){
        return ResponseEntity.ok(ApiResponse.ok(salonServiceService.getNameAndIdOfServices(), "Fetched name and id of services"));
    }

    @GetMapping
    @Operation(summary = "fetch all services to list on admin ui")
    public ResponseEntity<ApiResponse<List<ServiceListResponse>>> getAllServices() {
        return ResponseEntity.ok(
                ApiResponse.ok(salonServiceService.getAllServicesAdmin(), "Fetched all services successfully"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "get detail of one service")
    public ResponseEntity<ApiResponse<ServiceDetailResponse>> getServiceDetail(
            @ValidId @PathVariable Long id
    ) {
        return ResponseEntity.ok(
                ApiResponse.ok(salonServiceService.getServiceDetail(id), "Fetched detail of service : "+id));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "to add new service")
    public ResponseEntity<ApiResponse<?>> createService(
            @RequestPart("serviceDetails") ServiceCreateRequest serviceDetails,
            @RequestPart("image") MultipartFile image
    ) {
        salonServiceService.createService(serviceDetails, image);
        return ResponseEntity.ok(ApiResponse.ok("Service added successfully"));
    }

    @PutMapping("/{id}")
    @Operation(summary = "to update the detail of service")
    public ResponseEntity<ApiResponse<?>> updateService(
            @ValidId @PathVariable Long id,
            @RequestBody ServiceUpdateRequest request
    ) {
        salonServiceService.updateService(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Updated Successfully"));
    }

    @PutMapping("/{id}/toggle")
    @Operation(summary = "to toggle service status")
    public ResponseEntity<ApiResponse<?>> toggleServiceStatus(
            @ValidId @PathVariable Long id
    ) {
        salonServiceService.toggleServiceStatus(id);
        return ResponseEntity.ok(ApiResponse.ok("Toggled Successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> deleteService(
            @ValidId @PathVariable Long id
    ) {
        salonServiceService.deleteService(id);
        return ResponseEntity.ok(ApiResponse.ok("Service deleted successfully"));
    }

    @PostMapping("/assign-staff/{serviceId}")
    @Operation(summary = "assign staff to the any service")
    public ResponseEntity<ApiResponse<?>> assignStaffToService(
            @ValidId @PathVariable Long serviceId,
            @Valid @RequestBody AssignStaffToServiceRequest request
    ){
        salonServiceService.assignStaffToService(serviceId, request);
        return ResponseEntity.ok(ApiResponse.ok("Successfully added staff in service: "+serviceId));
    }

}
