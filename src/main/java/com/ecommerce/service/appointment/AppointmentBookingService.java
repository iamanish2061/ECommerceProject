package com.ecommerce.service.appointment;

import com.ecommerce.dto.intermediate.AppointmentDetailForEvent;
import com.ecommerce.dto.intermediate.TempAppointmentDetails;
import com.ecommerce.dto.request.service.BookingRequest;
import com.ecommerce.dto.response.appointment.AppointmentDetailAdminResponse;
import com.ecommerce.dto.response.appointment.AppointmentDetailResponse;
import com.ecommerce.dto.response.appointment.AppointmentResponse;
import com.ecommerce.dto.response.appointment.AvailableTimeResponse;
import com.ecommerce.dto.response.payment.PaymentRedirectResponse;
import com.ecommerce.dto.response.service.TimeSlotRecommendation;
import com.ecommerce.esewa.Esewa;
import com.ecommerce.exception.ApplicationException;
import com.ecommerce.mapper.appointment.AppointmentMapper;
import com.ecommerce.model.payment.PaymentMethod;
import com.ecommerce.model.service.*;
import com.ecommerce.model.user.Staff;
import com.ecommerce.model.user.UserModel;
import com.ecommerce.rabbitmq.dto.NotificationEvent;
import com.ecommerce.rabbitmq.producer.NotificationProducer;
import com.ecommerce.repository.service.AppointmentRepository;
import com.ecommerce.repository.service.ServiceRepository;
import com.ecommerce.repository.service.StaffLeaveRepository;
import com.ecommerce.repository.service.StaffWorkingHoursRepository;
import com.ecommerce.repository.user.StaffRepository;
import com.ecommerce.service.payment.PaymentService;
import com.ecommerce.service.recommendation.AppointmentRecommendationService;
import com.ecommerce.utils.EventHelper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AppointmentBookingService {

    private final AppointmentRepository appointmentRepository;
    private final ServiceRepository serviceRepository;
    private final StaffRepository staffRepository;
    private final StaffLeaveRepository staffLeaveRepository;
    private final StaffWorkingHoursRepository staffWorkingHoursRepository;
    private final AppointmentRecommendationService recommendationService;
    private final PaymentService paymentService;
    private final NotificationProducer notificationProducer;

    private final AppointmentMapper appointmentMapper;

    private static final BigDecimal ADVANCE_PERCENTAGE = new BigDecimal("0.10");
    private static final String STAFF_NOT_FOUND = "Staff not found";
    private static final String STAFF_NOT_FOUND_CODE = "STAFF_NOT_FOUND";
    private static final String SERVICE_NOT_FOUND = "Service not found";
    private static final String SERVICE_NOT_FOUND_CODE = "SERVICE_NOT_FOUND";

    // ==================== User Booking Methods ====================
    public List<AvailableTimeResponse> getAvailableTime(Long serviceId, LocalDate bookingDate, Long staffId) {
        // 1. Validate Service
        ServiceModel service = serviceRepository.findById(serviceId)
                .filter(ServiceModel::isActive)
                .orElseThrow(() -> new ApplicationException(SERVICE_NOT_FOUND, SERVICE_NOT_FOUND_CODE, HttpStatus.NOT_FOUND));

        int duration = service.getDurationMinutes();

        // 2. Identify Target Staff
        List<Staff> targetStaff = (staffId != null && staffId != 0)
                ? List.of(staffRepository.findById(staffId).orElseThrow(() -> new ApplicationException(STAFF_NOT_FOUND, STAFF_NOT_FOUND_CODE, HttpStatus.NOT_FOUND)))
                : staffRepository.findByServiceId(serviceId);

        if (targetStaff.isEmpty()) return List.of();

        List<Long> staffIds = targetStaff.stream().map(Staff::getId).toList();

        // 3. Bulk Fetch Data (Prevention of N+1)
        Map<Long, List<Appointment>> appointmentsMap = appointmentRepository
                .findAllByStaffIdInAndBookingDate(staffIds, bookingDate)
                .stream().collect(Collectors.groupingBy(a -> a.getStaff().getId()));

        Map<Long, StaffWorkingHours> workingHoursMap = staffWorkingHoursRepository
                .findAllByStaffIdInAndDayOfWeek(staffIds, bookingDate.getDayOfWeek())
                .stream().collect(Collectors.toMap(wh -> wh.getStaff().getId(), wh -> wh));

        Map<Long, StaffLeave> leavesMap = staffLeaveRepository
                .findAllByStaffIdInAndLeaveDate(staffIds, bookingDate)
                .stream().collect(Collectors.toMap(l -> l.getStaff().getId(), l -> l));

        // 4. Generate & Filter Slots
        // TreeSet with Comparator ensures slots are unique and sorted chronologically
        Set<AvailableTimeResponse> uniqueSlots = new TreeSet<>(Comparator.comparing(AvailableTimeResponse::startTime));

        // If booking for today, only show slots starting 30 mins from now
        LocalTime nowBuffer = (bookingDate.equals(LocalDate.now())) ? LocalTime.now().plusMinutes(30) : null;

        for (Staff staff : targetStaff) {
            StaffWorkingHours wh = workingHoursMap.get(staff.getId());
            if (wh == null || !wh.isWorkingDay()) continue;

            LocalTime current = wh.getStartTime();
            List<Appointment> staffAppts = appointmentsMap.getOrDefault(staff.getId(), List.of());
            StaffLeave leave = leavesMap.get(staff.getId());

            // Iterate in 15-minute increments
            while (!current.plusMinutes(duration).isAfter(wh.getEndTime())) {
                LocalTime slotEnd = current.plusMinutes(duration);

                if (isSlotFree(current, slotEnd, nowBuffer, staffAppts, leave)) {
                    uniqueSlots.add(new AvailableTimeResponse(current, slotEnd));
                }
                current = current.plusMinutes(15);
            }
        }

        return new ArrayList<>(uniqueSlots);
    }

    private boolean isSlotFree(LocalTime start, LocalTime end, LocalTime nowBuffer, List<Appointment> appts, StaffLeave leave) {

        // Check 1: Is it in the past?
        if (nowBuffer != null && start.isBefore(nowBuffer)) return false;

        // Check 2: Does it overlap with Leave?
        if (leave != null) {
            if (leave.getStartTime() == null) return false; // Full day leave
            if (start.isBefore(leave.getEndTime()) && leave.getStartTime().isBefore(end)) return false;
        }

        // Check 3: Does it overlap with existing Appointments?
        return appts.stream().noneMatch(a -> start.isBefore(a.getEndTime()) && a.getStartTime().isBefore(end));
    }

    public Map<String, List<?>> getRecommendationAndTime(Long userId, Long serviceId, LocalDate bookingDate, Long staffId) {
        List<TimeSlotRecommendation> recommendations = getRecommendations(userId, serviceId, staffId, bookingDate);
        List<AvailableTimeResponse> availableTimes = getAvailableTime(serviceId, bookingDate, staffId);

        return Map.of("AvailableTime", availableTimes,
                "RecommendedTime", recommendations);
    }

    public List<TimeSlotRecommendation> getRecommendations(Long userId, Long serviceId, Long staffId, LocalDate bookingDate) {
        return recommendationService.getRecommendedSlots(userId, serviceId, staffId, LocalDate.now(), LocalDate.now());
    }

    @Transactional
    public PaymentRedirectResponse createBooking(Long userId, BookingRequest request) {
        // 1. Validate Service
        ServiceModel service = serviceRepository.findById(request.serviceId())
                .filter(ServiceModel::isActive)
                .orElseThrow(() -> new ApplicationException(SERVICE_NOT_FOUND, SERVICE_NOT_FOUND_CODE, HttpStatus.NOT_FOUND));

        // 2. Validate DateTime logic (Check if booking is in the past)
        LocalDateTime startDateTime = LocalDateTime.of(request.bookingDate(), request.startTime());
        if (startDateTime.isBefore(LocalDateTime.now().plusMinutes(15))) {
            throw new ApplicationException("Appointments must be booked at least 15 minutes in advance", "INVALID_TIME", HttpStatus.BAD_REQUEST);
        }

        // 3. Resolve Staff
        Staff assignedStaff;
        if (request.staffId() != null && request.staffId() != 0) {
            // User picked a specific staff - validate they are free
            assignedStaff = staffRepository.findById(request.staffId())
                    .orElseThrow(() -> new ApplicationException(STAFF_NOT_FOUND, STAFF_NOT_FOUND_CODE, HttpStatus.NOT_FOUND));

            if (appointmentRepository.existsOverlappingAppointment(assignedStaff.getId(), request.bookingDate(), request.startTime(), request.endTime())) {
                throw new ApplicationException("The selected staff is no longer available for this time slot", "STAFF_BUSY", HttpStatus.CONFLICT);
            }
        } else {
            assignedStaff = findFirstAvailableStaff(request.serviceId(), request.bookingDate(), request.startTime(), request.endTime());
        }

        // 4. Calculate amounts
        BigDecimal totalAmount = service.getPrice();
        // Assuming ADVANCE_PERCENTAGE is a constant in your service (e.g., 0.10 for 10%)
        BigDecimal advanceAmount = totalAmount.multiply(ADVANCE_PERCENTAGE)
                .setScale(2, RoundingMode.HALF_UP);

        // 5. Generate unique transaction tracking
        String transactionId = "APT_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        // 6. Store in Redis (Setting TTL to e.g., 15 minutes)
        TempAppointmentDetails tempDetails = TempAppointmentDetails.builder()
                .userId(userId)
                .serviceId(service.getId())
                .staffId(assignedStaff.getId())
                .appointmentDate(request.bookingDate())
                .startTime(request.startTime())
                .endTime(request.endTime())
                .paymentMethod(request.paymentMethod())
                .specialNotes(request.specialNotes())
                .totalAmount(totalAmount)
                .advanceAmount(advanceAmount)
                .transactionId(transactionId)
                .createdAt(LocalDateTime.now())
                .build();

        if(request.paymentMethod() == PaymentMethod.KHALTI){
            String url = paymentService.payWithKhalti(tempDetails);
            return new PaymentRedirectResponse(
                    PaymentMethod.KHALTI,
                    url,
                    null
            );
        } else if (request.paymentMethod() == PaymentMethod.ESEWA) {
            Esewa esewa= paymentService.payWithEsewa(tempDetails);
            return new PaymentRedirectResponse(
                    PaymentMethod.ESEWA,
                    null,
                    esewa
            );
        }
        return null;
    }

    private Staff findFirstAvailableStaff(Long serviceId, LocalDate date, LocalTime start, LocalTime end) {
        List<Staff> eligibleStaff = staffRepository.findByServiceId(serviceId);

        return eligibleStaff.stream()
                .filter(s -> !appointmentRepository.existsOverlappingAppointment(s.getId(), date, start, end))
                // Add extra filter for Working Hours/Leave if not already handled by frontend selection
                .findFirst()
                .orElseThrow(() -> new ApplicationException("No staff available for this specific time slot", "NO_STAFF_AVAILABLE", HttpStatus.NOT_FOUND));
    }

    @Transactional
    public void cancelAppointment(Long appointmentId, UserModel user) {
        Appointment appointment = appointmentRepository.findWithDetailsById(appointmentId)
                .orElseThrow(() -> new ApplicationException("Appointment not found", "NOT_FOUND", HttpStatus.NOT_FOUND));

        // Verify ownership
        if (!appointment.getCustomer().getId().equals(user.getId())) {
            throw new ApplicationException("Cannot cancel another user's appointment", "NOT_FOUND", HttpStatus.BAD_REQUEST);
        }

        // Check if cancellable
        if (appointment.getStatus() == AppointmentStatus.COMPLETED ||
                appointment.getStatus() == AppointmentStatus.CANCELLED) {
            throw new ApplicationException("Cannot cancel this appointment", "INVALID_OPERATION",
                    HttpStatus.BAD_REQUEST);
        }

        // Check cancellation window (e.g., at least 2 hours before)
        LocalDateTime appointmentFullTime = appointment.getAppointmentDate().atTime(appointment.getStartTime());
        if (appointmentFullTime.minusHours(2).isBefore(LocalDateTime.now())) {
            throw new ApplicationException("Cannot cancel within 2 hours of appointment", "INVALID_OPERATION",
                    HttpStatus.BAD_REQUEST);
        }

        appointment.setStatus(AppointmentStatus.CANCELLED);
        appointmentRepository.save(appointment);
        AppointmentDetailForEvent detail = AppointmentDetailForEvent.builder()
                .userId(user.getId())
                .user(user.getUsername())
                .email(user.getEmail())
                .staffId(appointment.getStaff().getId())
                .staffName(appointment.getStaff().getUser().getUsername())
                .serviceName(appointment.getService().getName())
                .appointmentDate(appointment.getAppointmentDate())
                .build();
        NotificationEvent event = EventHelper.createEventForAppointmentCancellation(detail);
        notificationProducer.send("notify.user", event);
    }


    // ==================== Query Methods ====================
    public List<AppointmentResponse> getRecentAppointmentsOf(UserModel user) {
        List<Appointment> appointments = appointmentRepository.findByCustomerIdOrderByAppointmentDateDesc(user.getId());
        return appointments.stream()
                .sorted(Comparator.comparing(Appointment::getCreatedAt).reversed())
                .map(appointmentMapper::mapEntityToAppointmentResponse)
                .limit(3)
                .toList();
    }

    public List<AppointmentResponse> getUserAppointments(Long userId) {
        return appointmentRepository.findByCustomerIdOrderByAppointmentDateDesc(userId).stream()
                .map(appointmentMapper::mapEntityToAppointmentResponse)
                .toList();
    }

    public AppointmentDetailResponse getAppointmentDetail(Long appointmentId, Long userId) {
        Appointment appointment = appointmentRepository.findWithDetailsById(appointmentId)
                .orElseThrow(() -> new ApplicationException("Appointment not found", "NOT_FOUND", HttpStatus.NOT_FOUND));
        // Verify access
        if (!appointment.getCustomer().getId().equals(userId)) {
            throw new ApplicationException("Access denied", "INVALID_ACTION", HttpStatus.BAD_REQUEST);
        }
        return appointmentMapper.mapEntityToAppointmentDetailResponse(appointment);
    }


    // ==================== Admin Methods ====================
    public List<AppointmentResponse> getAllAppointments() {
        return appointmentRepository.findAllByOrderByAppointmentDateDesc().stream()
                .map(appointmentMapper::mapEntityToAppointmentResponse)
                .toList();
    }

    public AppointmentDetailAdminResponse getAdminAppointmentDetail(Long appointmentId) {
        Appointment appointment = appointmentRepository.findWithDetailsById(appointmentId)
                .orElseThrow(() -> new ApplicationException("Appointment not found", "NOT_FOUND", HttpStatus.NOT_FOUND));
        return appointmentMapper.mapEntityToAppointmentDetailAdminResponse(appointment);
    }

    @Transactional
    public void updateAppointmentStatus(Long appointmentId, AppointmentStatus status) {
        Appointment appointment = appointmentRepository.findWithDetailsById(appointmentId)
                .orElseThrow(() -> new ApplicationException("Appointment not found", "NOT_FOUND", HttpStatus.NOT_FOUND));

        appointment.setStatus(status);
        if(status == AppointmentStatus.COMPLETED){
            appointment.setTotalAmount(appointment.getService().getPrice());
        }

        AppointmentDetailForEvent detail = AppointmentDetailForEvent.builder()
                .userId(appointment.getCustomer().getId())
                .user(appointment.getCustomer().getUsername())
                .email(appointment.getCustomer().getEmail())
                .staffId(appointment.getStaff().getId())
                .staffName(appointment.getStaff().getUser().getUsername())
                .serviceName(appointment.getService().getName())
                .appointmentDate(appointment.getAppointmentDate())
                .build();

        NotificationEvent event = null;
        if(status == AppointmentStatus.NO_SHOW){
            event = EventHelper.createEventForAppointmentNoShow(detail);
        }else if(status == AppointmentStatus.COMPLETED){
            event = EventHelper.createEventForAppointmentCompletion(detail);
        }else if(status == AppointmentStatus.CANCELLED){
            event = EventHelper.createEventForAppointmentCancellation(detail);
        }
        notificationProducer.send("notify.user", event);
    }

}
