package com.ecommerce.controller.admin;

import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.payment.AdminPaymentResponse;
import com.ecommerce.dto.response.payment.DetailAdminPaymentResponse;
import com.ecommerce.model.payment.PaymentStatus;
import com.ecommerce.service.admin.AdminPaymentService;
import com.ecommerce.validation.ValidId;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Validated
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/admin/payments")
public class AdminPaymentController {

    private final AdminPaymentService paymentService;

    @GetMapping("/get-status")
    @Operation(summary = "to fetch all the payment status used in drop downs")
    public ResponseEntity<ApiResponse<List<PaymentStatus>>> getAllPaymentStatus(){
        return ResponseEntity.ok(ApiResponse.ok(paymentService.getAllPaymentStatus(), "Fetched all payment status"));
    }

    @GetMapping
    @Operation(summary = "to fetch all the payments")
    public ResponseEntity<ApiResponse<List<AdminPaymentResponse>>> getAllPayments() {
        return ResponseEntity.ok(
                ApiResponse.ok(paymentService.getAllPayments(), "All payments fetched successfully"));
    }

    @GetMapping("/{paymentId}")
    @Operation(summary = "to fetch detail of one payment")
    public ResponseEntity<ApiResponse<DetailAdminPaymentResponse>> getDetailofPayment(
            @ValidId @PathVariable Long paymentId
    ){
        return ResponseEntity.ok(
                ApiResponse.ok(paymentService.getAdminPaymentDetail(paymentId), "Fetched detail of payment")
        );
    }

    @PutMapping("/{id}/status")
    @Operation(summary = "to update status of payment")
    public ResponseEntity<ApiResponse<?>> updateStatus(
            @ValidId @PathVariable Long id,
            @RequestParam PaymentStatus status
    ) {
        paymentService.updatePaymentStatus(id, status);
        return ResponseEntity.ok(ApiResponse.ok("Status updated successfully"));
    }

}
