package com.ecommerce.dto.intermediate;

import com.ecommerce.model.payment.PaymentMethod;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;


@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TempAppointmentDetails implements Serializable {

    private Long userId;
    private Long serviceId;
    private Long staffId;
    private LocalDate appointmentDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private String specialNotes;

    private BigDecimal totalAmount;
    private BigDecimal advanceAmount;
    private PaymentMethod paymentMethod;

    private String transactionId;
    private LocalDateTime createdAt;
}
