package com.ecommerce.service.staff;

import com.ecommerce.dto.request.staff.StaffAssignRequest;
import com.ecommerce.dto.request.staff.StaffLeaveRequest;
import com.ecommerce.dto.request.staff.WorkingHoursRequest;
import com.ecommerce.dto.response.service.ServiceSummaryResponse;
import com.ecommerce.dto.response.staff.StaffDetailResponse;
import com.ecommerce.dto.response.staff.LeaveSummaryResponse;
import com.ecommerce.dto.response.staff.NameAndIdOfStaffResponse;
import com.ecommerce.dto.response.staff.StaffListResponse;
import com.ecommerce.dto.response.staff.WorkingHourResponse;
import com.ecommerce.exception.ApplicationException;
import com.ecommerce.mapper.service.ServiceMapper;
import com.ecommerce.mapper.staff.LeaveMapper;
import com.ecommerce.mapper.staff.StaffMapper;
import com.ecommerce.mapper.staff.WorkingHourMapper;
import com.ecommerce.model.service.ServiceModel;
import com.ecommerce.model.service.StaffLeave;
import com.ecommerce.model.service.StaffWorkingHours;
import com.ecommerce.model.user.Role;
import com.ecommerce.model.user.Staff;
import com.ecommerce.model.user.StaffRole;
import com.ecommerce.model.user.UserModel;
import com.ecommerce.repository.service.AppointmentRepository;
import com.ecommerce.repository.service.ServiceRepository;
import com.ecommerce.repository.service.StaffLeaveRepository;
import com.ecommerce.repository.service.StaffWorkingHoursRepository;
import com.ecommerce.repository.user.StaffRepository;
import com.ecommerce.repository.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StaffManagementService {

    private final StaffRepository staffRepository;
    private final UserRepository userRepository;
    private final ServiceRepository serviceRepository;
    private final StaffWorkingHoursRepository workingHoursRepository;
    private final StaffLeaveRepository leaveRepository;
    private final AppointmentRepository appointmentRepository;

    private final StaffMapper staffMapper;
    private final ServiceMapper serviceMapper;
    private final WorkingHourMapper workingHourMapper;
    private final LeaveMapper leaveMapper;

    // ==================== List Methods ====================
    public List<StaffRole> getExpertFieldList() {
        return List.of(
                StaffRole.BARBER,
                StaffRole.BEAUTICIAN,
                StaffRole.COLORIST,
                StaffRole.HAIR_STYLIST,
                StaffRole.RECEPTIONIST,
                StaffRole.NAIL_TECHNICIAN,
                StaffRole.THERAPIST,
                StaffRole.MAKEUP_ARTIST);
    }

    public List<NameAndIdOfStaffResponse> getNameAndIdOfStaff() {
        return staffRepository.findAllByOrderByIdDesc().stream().map(
                s -> new NameAndIdOfStaffResponse(s.getId(), s.getUser().getFullName())).toList();
    }

    public List<StaffListResponse> getAllStaff() {
        List<Staff> staff = staffRepository.findAllByOrderByIdDesc();
        return staff.stream()
                .map(s -> staffMapper.mapEntityToStaffListResponse(s, s.getServices().size()))
                .toList();
    }

    public StaffDetailResponse getStaffDetail(Long staffId) {
        Staff staff = staffRepository.findWithDetailsById(staffId)
                .orElseThrow(() -> new ApplicationException("Staff not found with id: " + staffId, "NOT_FOUND",
                        HttpStatus.NOT_FOUND));
        StaffListResponse response = staffMapper.mapEntityToStaffListResponse(staff, staff.getServices().size());
        List<ServiceSummaryResponse> serviceResponse = staff.getServices().stream()
                .map(serviceMapper::mapEntityToServiceSummaryResponse)
                .toList();

        List<WorkingHourResponse> workingHours = workingHoursRepository.findByStaffId(staff.getId()).stream()
                .map(workingHourMapper::mapEntityToWorkingHourResponse)
                .toList();

        List<LeaveSummaryResponse> leave = leaveRepository.findUpcomingLeaves(staff.getId(), LocalDate.now())
                .stream()
                .map(leaveMapper::mapEntityToLeaveSummaryResponse)
                .toList();

        int upcomingCount = appointmentRepository
                .findUpcomingByStaffId(staff.getId(), LocalDate.now()).size();

        return new StaffDetailResponse(response, serviceResponse, workingHours, leave, upcomingCount);
    }

    // ==================== Staff Assignment ====================
    @Transactional
    public void assignStaffRole(StaffAssignRequest request) {
        UserModel user = userRepository.findById(request.userId())
                .orElseThrow(() -> new ApplicationException("User not found with id: " + request.userId(), "NOT_FOUND",
                        HttpStatus.NOT_FOUND));

        if (staffRepository.existsByUserId(request.userId())) {
            throw new ApplicationException("User is already assigned as staff", "ALREADY_ASSIGNED",
                    HttpStatus.CONFLICT);
        }

        // Create staff record
        Staff staff = Staff.builder()
                .user(user)
                .expertiseIn(request.expertiseIn())
                .joinedDate(LocalDate.now())
                .build();

        // Update user role
        user.setRole(Role.ROLE_STAFF);
        user.addStaff(staff);

        // Assign services if provided
        if (request.serviceIds() != null && !request.serviceIds().isEmpty()) {
            List<ServiceModel> services = serviceRepository.findAllById(request.serviceIds());
            staff.addServices(services);
        }

        Staff saved = staffRepository.save(staff);
        userRepository.save(user);

        // Initialize default working hours (Sunn-Sat, 10 AM - 7 PM)
        initializeDefaultWorkingHours(saved);

    }

    private void initializeDefaultWorkingHours(Staff staff) {
        DayOfWeek[] workingDays = {
                DayOfWeek.SUNDAY, DayOfWeek.MONDAY, DayOfWeek.TUESDAY,
                DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY,
                DayOfWeek.FRIDAY, DayOfWeek.SATURDAY
        };

        for (DayOfWeek day : DayOfWeek.values()) {
            StaffWorkingHours hours = new StaffWorkingHours();
            hours.setStaff(staff);
            hours.setDayOfWeek(day);
            hours.setStartTime(LocalTime.of(10, 0));
            hours.setEndTime(LocalTime.of(19, 0));
            hours.setWorkingDay(true);
            workingHoursRepository.save(hours);
        }
    }

    // ==================== Working Hours ====================
    @Transactional
    public void setWorkingHours(Long staffId, List<WorkingHoursRequest> requests) {
        Staff staff = staffRepository.findById(staffId)
                .orElseThrow(() -> new ApplicationException("Staff not found with id: " + staffId, "NOT_FOUND",
                        HttpStatus.NOT_FOUND));

        workingHoursRepository.deleteByStaffId(staffId);
        System.out.println("hello success");

        List<StaffWorkingHours> hoursList = requests.stream()
                .map(schedule -> {
                    StaffWorkingHours hours = new StaffWorkingHours();
                    hours.setStaff(staff);
                    hours.setDayOfWeek(schedule.dayOfWeek());
                    hours.setStartTime(schedule.startTime());
                    hours.setEndTime(schedule.endTime());
                    hours.setWorkingDay(schedule.isWorkingDay());
                    return hours;
                })
                .toList();

        workingHoursRepository.saveAll(hoursList);
    }

    // ==================== Leave Management ====================
    @Transactional
    public void addStaffLeave(Long staffId, StaffLeaveRequest request) {
        Staff staff = staffRepository.findById(staffId)
                .orElseThrow(() -> new ApplicationException("Staff not found with id: " + staffId, "NOT_FOUND",
                        HttpStatus.NOT_FOUND));

        // Check if leave already exists for this date
        if (leaveRepository.findByStaffIdAndLeaveDate(staffId, request.leaveDate()).isPresent()) {
            throw new ApplicationException("Leave already exists for this date", "ALREADY_EXISTS", HttpStatus.CONFLICT);
        }

        StaffLeave leave = new StaffLeave();
        leave.setStaff(staff);
        leave.setLeaveDate(request.leaveDate());
        leave.setStartTime(request.startTime());
        leave.setEndTime(request.endTime());
        leave.setReason(request.reason());

        leaveRepository.save(leave);
    }

    @Transactional
    public void removeStaffLeave(Long staffId, Long leaveId) {
        leaveRepository.deleteByIdAndStaffId(leaveId, staffId);
    }

    // ==================== Service Assignment ====================
    @Transactional
    public void assignServicesToStaff(Long staffId, List<Long> serviceIds) {
        Staff staff = staffRepository.findById(staffId)
                .orElseThrow(() -> new ApplicationException("Staff not found with id: " + staffId, "NOT_FOUND",
                        HttpStatus.NOT_FOUND));

        List<ServiceModel> services = serviceRepository.findAllById(serviceIds);
        staff.addServices(services);
        staffRepository.save(staff);
    }

    @Transactional
    public void removeServiceFromStaff(Long staffId, Long serviceId) {
        Staff staff = staffRepository.findById(staffId)
                .orElseThrow(() -> new ApplicationException("Staff not found with id: " + staffId, "NOT_FOUND",
                        HttpStatus.NOT_FOUND));
        ServiceModel service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new ApplicationException("Service not found with id: " + serviceId, "NOT_FOUND",
                        HttpStatus.NOT_FOUND));

        staff.removeService(service);
        staffRepository.save(staff);
    }

}
