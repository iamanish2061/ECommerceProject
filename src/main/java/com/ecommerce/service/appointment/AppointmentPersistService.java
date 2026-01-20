package com.ecommerce.service.appointment;

import com.ecommerce.dto.intermediate.AppointmentDetailForEvent;
import com.ecommerce.dto.intermediate.TempAppointmentDetails;
import com.ecommerce.exception.ApplicationException;
import com.ecommerce.model.payment.PaymentModel;
import com.ecommerce.model.service.Appointment;
import com.ecommerce.model.service.AppointmentStatus;
import com.ecommerce.model.service.ServiceModel;
import com.ecommerce.model.user.Staff;
import com.ecommerce.model.user.UserModel;
import com.ecommerce.rabbitmq.dto.NotificationEvent;
import com.ecommerce.rabbitmq.producer.NotificationProducer;
import com.ecommerce.redis.RedisService;
import com.ecommerce.repository.payment.PaymentRepository;
import com.ecommerce.repository.service.AppointmentRepository;
import com.ecommerce.repository.service.ServiceRepository;
import com.ecommerce.repository.user.StaffRepository;
import com.ecommerce.repository.user.UserRepository;
import com.ecommerce.service.recommendation.UserAppointmentHistoryUpdater;
import com.ecommerce.utils.EventHelper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Slf4j
@Service
@RequiredArgsConstructor
public class AppointmentPersistService {

    private final RedisService redisService;
    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final StaffRepository staffRepository;
    private final ServiceRepository serviceRepository;
    private final AppointmentRepository appointmentRepository;
    private final NotificationProducer notificationProducer;
    private final UserAppointmentHistoryUpdater userAppointmentHistoryUpdater;

    @Transactional
    public void handleEsewaAppointmentDetails(boolean success, PaymentModel payment){
        if(success){
            PaymentModel existingPayment = paymentRepository.findByTransactionId(payment.getTransactionId()).orElse(null);
            if(existingPayment != null){
                throw new ApplicationException("Payment already exists!", "PAYMENT_ALREADY_EXIST", HttpStatus.BAD_REQUEST);
            }
            TempAppointmentDetails appointmentDetails = redisService.getTempAppointment(payment.getTransactionId());
            if(appointmentDetails == null){
                throw new ApplicationException("Request time out!", "SESSION_TIMEOUT", HttpStatus.NOT_FOUND);
            }

            BigDecimal expected = appointmentDetails.getAdvanceAmount().setScale(5, RoundingMode.HALF_UP);
            BigDecimal actual = payment.getAmount().setScale(5, RoundingMode.HALF_UP);

            if (expected.compareTo(actual) != 0) {
                throw new ApplicationException("Invalid Payment!", "INVALID_PAYMENT", HttpStatus.BAD_REQUEST);
            }

            saveAppointment(payment, appointmentDetails);
        }
        if(payment != null){
            redisService.deleteTempAppointment(payment.getTransactionId());
        }

    }

    @Transactional
    public void handleKhaltiAppointmentDetails(boolean success, PaymentModel payment, String purchaseId){
        if(success){
            PaymentModel existingPayment = paymentRepository.findByTransactionId(payment.getTransactionId()).orElse(null);
            if(existingPayment != null){
                throw new ApplicationException("Payment already exists!", "PAYMENT_ALREADY_EXIST", HttpStatus.BAD_REQUEST);
            }
            TempAppointmentDetails appointmentDetails = redisService.getTempAppointment(purchaseId);
            if(appointmentDetails == null){
                throw new ApplicationException("Request time out!", "SESSION_TIMEOUT", HttpStatus.NOT_FOUND);
            }

            BigDecimal expected = appointmentDetails.getAdvanceAmount().setScale(5, RoundingMode.HALF_UP);
            BigDecimal actual = payment.getAmount().setScale(5, RoundingMode.HALF_UP);

            if (expected.compareTo(actual) != 0) {
                throw new ApplicationException("Invalid Payment!", "INVALID_PAYMENT", HttpStatus.BAD_REQUEST);
            }
            saveAppointment(payment, appointmentDetails);
        }
        redisService.deleteTempAppointment(purchaseId);
    }

    private void saveAppointment(PaymentModel payment, TempAppointmentDetails appointmentDetails) {
        UserModel user = userRepository.findById(appointmentDetails.getUserId())
                .orElseThrow(()-> new ApplicationException("User not found!", "USER_NOT_FOUND", HttpStatus.NOT_FOUND));
        Staff staff = staffRepository.findWithDetailsById(appointmentDetails.getStaffId())
                .orElseThrow(()-> new ApplicationException("Staff not found!", "STAFF_NOT_FOUND", HttpStatus.NOT_FOUND));
        ServiceModel service = serviceRepository.findById(appointmentDetails.getServiceId())
                .orElseThrow(()-> new ApplicationException("Service not found!", "SERVICE_NOT_FOUND", HttpStatus.NOT_FOUND));
        payment.setUser(user);

        Appointment appointment = Appointment.builder()
                .customer(user)
                .staff(staff)
                .service(service)
                .appointmentDate(appointmentDetails.getAppointmentDate())
                .startTime(appointmentDetails.getStartTime())
                .endTime(appointmentDetails.getEndTime())
                .status(AppointmentStatus.BOOKED)
                .specialNotes(appointmentDetails.getSpecialNotes())
                .totalAmount(appointmentDetails.getTotalAmount())
                .createdAt(appointmentDetails.getCreatedAt())
                .build();
        appointment.addPayment(payment);
        staff.addAppointment(appointment);
        appointmentRepository.save(appointment);

//        updating history
        userAppointmentHistoryUpdater.updateUserAppointmentHistoryAsync(appointment.getCustomer().getId(), appointment.getStartTime());

        AppointmentDetailForEvent detail = AppointmentDetailForEvent.builder()
                .userId(user.getId())
                .user(user.getUsername())
                .email(user.getEmail())
                .staffId(staff.getId())
                .staffName(staff.getUser().getUsername())
                .serviceName(service.getName())
                .appointmentDate(appointmentDetails.getAppointmentDate())
                .build();

        NotificationEvent event = EventHelper.createEventForAppointment(detail);
        notificationProducer.send("notify.user", event);
    }

}
