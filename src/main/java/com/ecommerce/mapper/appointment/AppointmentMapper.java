package com.ecommerce.mapper.appointment;

import com.ecommerce.dto.response.appointment.AppointmentDetailAdminResponse;
import com.ecommerce.dto.response.appointment.AppointmentDetailResponse;
import com.ecommerce.dto.response.appointment.AppointmentResponse;
import com.ecommerce.dto.response.appointment.AppointmentSummaryResponse;
import com.ecommerce.mapper.payment.PaymentMapper;
import com.ecommerce.mapper.service.ServiceMapper;
import com.ecommerce.mapper.staff.StaffMapper;
import com.ecommerce.mapper.user.UserMapper;
import com.ecommerce.model.service.Appointment;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = { ServiceMapper.class, PaymentMapper.class, StaffMapper.class,
        UserMapper.class })
public interface AppointmentMapper {

    @Mapping(target = "appointmentId", source = "id")
    @Mapping(target = "username", source = "customer.username")
    @Mapping(target = "status", source = "status")
    @Mapping(target = "appointmentDate", source = "appointmentDate")
    @Mapping(target = "startTime", source = "startTime")
    @Mapping(target = "endTime", source = "endTime")
    @Mapping(target = "totalAmount", source = "totalAmount")
    @Mapping(target = "paymentStatus", source = "payment.paymentStatus")
    @Mapping(target = "response", source = "service")
    AppointmentResponse mapEntityToAppointmentResponse(Appointment appointment);

    @Mapping(target = "appointmentId", source = "id")
    @Mapping(target = "appointmentDate", source = "appointmentDate")
    @Mapping(target = "startTime", source = "startTime")
    @Mapping(target = "endTime", source = "endTime")
    @Mapping(target = "status", source = "status")
    @Mapping(target = "specialNotes", source = "specialNotes")
    @Mapping(target = "totalAmount", source = "totalAmount")
    @Mapping(target = "serviceResponse", source = "service")
    @Mapping(target = "paymentResponse", source = "payment")
    @Mapping(target = "staffResponse", source = "staff")
    @Mapping(target = "userResponse", source = "customer")
    AppointmentDetailAdminResponse mapEntityToAppointmentDetailAdminResponse(Appointment appointment);

    @Mapping(target = "appointmentId", source = "id")
    @Mapping(target = "appointmentDate", source = "appointmentDate")
    @Mapping(target = "startTime", source = "startTime")
    @Mapping(target = "endTime", source = "endTime")
    @Mapping(target = "status", source = "status")
    @Mapping(target = "specialNotes", source = "specialNotes")
    @Mapping(target = "totalAmount", source = "totalAmount")
    @Mapping(target = "serviceResponse", source = "service")
    @Mapping(target = "paymentResponse", source = "payment")
    @Mapping(target = "staffResponse", source = "staff")
    AppointmentDetailResponse mapEntityToAppointmentDetailResponse(Appointment appointment);

    @Mapping(target = "appointmentId", source = "id")
    AppointmentSummaryResponse mapEntityToAppointmentSummaryResponse(Appointment appointment);

}
