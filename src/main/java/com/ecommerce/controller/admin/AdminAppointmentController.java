package com.ecommerce.controller.admin;

import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.appointment.AppointmentDetailAdminResponse;
import com.ecommerce.dto.response.appointment.AppointmentResponse;
import com.ecommerce.model.service.AppointmentStatus;
import com.ecommerce.service.appointment.AppointmentBookingService;
import com.ecommerce.validation.ValidId;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/appointments")
@RequiredArgsConstructor
@Validated
public class AdminAppointmentController {

    private final AppointmentBookingService bookingService;

    @GetMapping
    @Operation(summary = "to fetch all the appointments")
    public ResponseEntity<ApiResponse<List<AppointmentResponse>>> getAllAppointments() {
        return ResponseEntity.ok(
                ApiResponse.ok(bookingService.getAllAppointments(), "All appointments fetched successfully"));
    }

    @GetMapping("/{appointmentId}")
    @Operation(summary = "to fetch detail of one appointment")
    public ResponseEntity<ApiResponse<AppointmentDetailAdminResponse>> getDetailofAppointment(
            @ValidId @PathVariable Long appointmentId
    ){
        return ResponseEntity.ok(
                ApiResponse.ok(bookingService.getAdminAppointmentDetail(appointmentId), "Fetched detail of appointment")
        );
    }

    @PutMapping("/{id}/status")
    @Operation(summary = "to update status of appointment")
    public ResponseEntity<ApiResponse<?>> updateStatus(
            @ValidId @PathVariable Long id,
            @RequestParam AppointmentStatus status
    ) {
        bookingService.updateAppointmentStatus(id, status);
        return ResponseEntity.ok(ApiResponse.ok("Status updated successfully"));
    }

}
