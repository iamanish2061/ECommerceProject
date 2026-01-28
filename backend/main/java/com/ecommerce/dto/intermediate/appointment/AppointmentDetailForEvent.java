package com.ecommerce.dto.intermediate.appointment;

import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AppointmentDetailForEvent {
    Long userId;
    String user;
    String email;
    Long staffId;
    String staffName;
    String serviceName;
    LocalDate appointmentDate;
}
