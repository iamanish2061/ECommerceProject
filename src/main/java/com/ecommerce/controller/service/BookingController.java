package com.ecommerce.controller.service;

import com.ecommerce.dto.request.service.BookingRequest;
import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.appointment.AppointmentDetailResponse;
import com.ecommerce.dto.response.appointment.AppointmentResponse;
import com.ecommerce.dto.response.appointment.BookingResponse;
import com.ecommerce.dto.response.service.TimeSlotRecommendation;
import com.ecommerce.model.user.UserPrincipal;
import com.ecommerce.service.appointment.AppointmentBookingService;
import com.ecommerce.validation.ValidId;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final AppointmentBookingService bookingService;

    @GetMapping("/recommendations")
    @Operation(summary = "to fetch recommendation of appointment time for any service")
    public ResponseEntity<ApiResponse<List<TimeSlotRecommendation>>> getRecommendations(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam Long serviceId,
            @RequestParam(required = false) Long staffId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        if(currentUser == null){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Please login to continue", "NOT_LOGGED_IN"));
        }
        return ResponseEntity.ok(ApiResponse.ok(
                bookingService.getRecommendations(
                        currentUser.getUser().getId(),
                        serviceId,
                        staffId,
                        startDate,
                        endDate
                ), "Recommendation fetched successfully"
        ));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<BookingResponse>> createBooking(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestBody BookingRequest request
    ) {
        if(currentUser == null){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Please login to continue", "NOT_LOGGED_IN"));
        }
        return ResponseEntity.ok(
                ApiResponse.ok(bookingService.createBooking(currentUser.getUser().getId(), request),"Booking successful"));
    }

    @PostMapping("/{transactionId}/confirm")
    public ResponseEntity<ApiResponse<AppointmentResponse>> confirmBooking(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable String transactionId
    ) {
        if(currentUser == null){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Please login to continue", "NOT_LOGGED_IN"));
        }
        return ResponseEntity.ok(
                ApiResponse.ok(bookingService.confirmBooking(transactionId, currentUser.getUser().getId()), "Confirmed"));
    }

    @GetMapping("/my-appointments")
    @Operation(summary = "to fetch all appointments of user")
    public ResponseEntity<ApiResponse<List<AppointmentResponse>>> getMyAppointments(
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        if(currentUser == null){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Please login to continue", "NOT_LOGGED_IN"));
        }
        return ResponseEntity.ok(
                ApiResponse.ok(bookingService.getUserAppointments(currentUser.getUser().getId()), "Fetched all appointments of user: "+currentUser.getUser().getId()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "to fetch detail of any appointment")
    public ResponseEntity<ApiResponse<AppointmentDetailResponse>> getAppointmentDetail(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @ValidId @PathVariable Long id
    ) {
        if(currentUser == null){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Please login to continue", "NOT_LOGGED_IN"));
        }
        return ResponseEntity.ok(ApiResponse.ok(
                bookingService.getAppointmentDetail(id, currentUser.getUser().getId()), "Fetched detail successfully"));
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "to cancel the appointment")
    public ResponseEntity<ApiResponse<?>> cancelAppointment(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @ValidId @PathVariable Long id
    ) {
        if(currentUser == null){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Please login to continue", "NOT_LOGGED_IN"));
        }
        bookingService.cancelAppointment(id, currentUser.getUser().getId());
        return ResponseEntity.ok(ApiResponse.ok("Appointment cancelled successfully"));
    }
}
