package com.ecommerce.dto.response.payment;

import com.ecommerce.dto.response.appointment.AppointmentSummaryResponse;
import com.ecommerce.dto.response.order.OrderResponse;
import com.ecommerce.dto.response.user.AllUsersResponse;

public record DetailAdminPaymentResponse(
    PaymentResponse response,
    AllUsersResponse userResponse,
    OrderResponse orderResponse,
    AppointmentSummaryResponse appointmentResponse
) {}
