package com.ecommerce.service.admin;

import com.ecommerce.dto.response.payment.AdminPaymentResponse;
import com.ecommerce.dto.response.payment.DetailAdminPaymentResponse;
import com.ecommerce.exception.ApplicationException;
import com.ecommerce.mapper.appointment.AppointmentMapper;
import com.ecommerce.mapper.payment.PaymentMapper;
import com.ecommerce.model.payment.PaymentModel;
import com.ecommerce.model.payment.PaymentStatus;
import com.ecommerce.repository.payment.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminPaymentService {

    private final PaymentRepository paymentRepository;
    private final PaymentMapper paymentMapper;
    private final AppointmentMapper appointmentMapper;

    public List<PaymentStatus> getAllPaymentStatus() {
        return List.of(
                PaymentStatus.COMPLETE,
                PaymentStatus.CANCELED,
                PaymentStatus.REFUNDED
        );
    }

    public List<AdminPaymentResponse> getAllPayments() {
        return paymentRepository.findAllPayments().stream()
                .map(paymentMapper::mapEntityToAdminPaymentResponse)
                .toList();
    }

    public DetailAdminPaymentResponse getAdminPaymentDetail(Long paymentId) {
        PaymentModel paymentModel = paymentRepository.findById(paymentId)
                .orElseThrow(()-> new ApplicationException("Payment not found!", "PAYMENT_NOT_FOUND", HttpStatus.NOT_FOUND));
        return paymentMapper.mapEntityToDetailAdminPaymentResponse(paymentModel, appointmentMapper.mapEntityToAppointmentSummaryResponse(paymentModel.getAppointment()));
    }

    @Transactional
    public void updatePaymentStatus(Long id, PaymentStatus status) {
        PaymentModel paymentModel = paymentRepository.findById(id)
                .orElseThrow(()-> new ApplicationException("Payment not found!", "PAYMENT_NOT_FOUND", HttpStatus.NOT_FOUND));
        paymentModel.setPaymentStatus(status);
    }
}
