package com.ecommerce.controller.service;

import com.ecommerce.controller.BaseController;
import com.ecommerce.dto.request.service.BookingRequest;
import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.appointment.AppointmentDetailResponse;
import com.ecommerce.dto.response.appointment.AppointmentResponse;
import com.ecommerce.dto.response.payment.PaymentRedirectResponse;
import com.ecommerce.model.user.UserPrincipal;
import com.ecommerce.service.appointment.AppointmentBookingService;
import com.ecommerce.validation.ValidId;
import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
@Validated
public class BookingController extends BaseController {

    private final AppointmentBookingService bookingService;

    @GetMapping("/time")
    @Operation(summary = "to fetch available time and recommendation of appointment time for any service")
    public ResponseEntity<ApiResponse<?>> getAvailableTime(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam Long serviceId,
            @RequestParam @NotNull(message = "Booking date is required") @FutureOrPresent(message = "Date cannot be in the past") @JsonFormat(pattern = "yyyy-MM-dd") LocalDate bookingDate,
            @RequestParam(required = false) Long staffId) {
        if (staffId == null) {
            staffId = 0L;
        }
        if (currentUser == null) {
            return ResponseEntity.ok(ApiResponse.ok(
                    bookingService.getAvailableTime(
                            serviceId,
                            bookingDate,
                            staffId),
                    "Available time fetched successfully"));
        } else {
            return ResponseEntity
                    .ok(ApiResponse.ok(bookingService.getRecommendationAndTime(currentUser.getUser().getId(), serviceId, bookingDate, staffId), "Recommended time and available time fetched successfully"));
        }
    }

    @PostMapping
    @Operation(summary = "to book an appointment")
    public ResponseEntity<ApiResponse<PaymentRedirectResponse>> createBooking(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody BookingRequest request
    ) {
        if (currentUser == null) {
            return unauthorized();
        }
        return success(bookingService.createBooking(currentUser.getUser().getId(), request),
                        "Ready to redirect");
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "to cancel the appointment")
    public ResponseEntity<ApiResponse<Void>> cancelAppointment(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @ValidId @PathVariable Long id
    ) {
        if (currentUser == null) {
            return unauthorized();
        }
        bookingService.cancelAppointment(id, currentUser.getUser());
        return success("Appointment cancelled successfully");
    }

    @GetMapping("/for-profile")
    @Operation(summary = "to list on profile page")
    public ResponseEntity<ApiResponse<List<AppointmentResponse>>> getRecentThreeAppointments(
            @AuthenticationPrincipal UserPrincipal currentUser
    ){
        if(currentUser == null){
            return unauthorized();
        }
        List<AppointmentResponse> response = bookingService.getRecentAppointmentsOf(currentUser.getUser());
        return success(response, "Recent appointments of user: "+currentUser.getUser().getId());
    }

    @GetMapping("/my-appointments")
    @Operation(summary = "to fetch all appointments of user")
    public ResponseEntity<ApiResponse<List<AppointmentResponse>>> getMyAppointments(
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        if (currentUser == null) {
            return unauthorized();
        }
        return success(bookingService.getUserAppointments(currentUser.getUser().getId()),
                        "Fetched all appointments of user: " + currentUser.getUser().getId());
    }

    @GetMapping("/appointment/{id}")
    @Operation(summary = "to fetch detail of any appointment")
    public ResponseEntity<ApiResponse<AppointmentDetailResponse>> getAppointmentDetail(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @ValidId @PathVariable Long id
    ) {
        if (currentUser == null) {
            return unauthorized();
        }
        return success(bookingService.getAppointmentDetail(id, currentUser.getUser().getId()), "Fetched detail successfully");
    }
}
