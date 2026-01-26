package com.ecommerce.service.recommendation;

import com.ecommerce.dto.intermediate.appointment.ScoredTimeSlot;
import com.ecommerce.dto.intermediate.appointment.TimeInterval;
import com.ecommerce.dto.response.service.TimeSlotRecommendation;
import com.ecommerce.dto.response.staff.StaffSummaryResponse;
import com.ecommerce.model.service.*;
import com.ecommerce.model.user.Staff;
import com.ecommerce.repository.service.*;
import com.ecommerce.repository.user.StaffRepository;
import com.ecommerce.utils.LabelHelper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AppointmentRecommendationService {

    private final StaffRepository staffRepository;
    private final ServiceRepository serviceRepository;
    private final AppointmentRepository appointmentRepository;
    private final StaffWorkingHoursRepository workingHoursRepository;
    private final StaffLeaveRepository leaveRepository;
    private final UserBookingHistoryRepository historyRepository;

    // Scoring weights: α + β + γ = 1.0
    private static final double ALPHA = 0.4; // User Preference
    private static final double BETA = 0.3;  // Staff Workload
    private static final double GAMMA = 0.3; // Time Fit (Avg Time)

    private static final double LAMBDA = 0.05; // Decay factor for time fit
    private static final int SLOT_INTERVAL = 15;
    private static final int MAX_SLOTS = 5;
    private static final int MAX_DAILY_APPOINTMENTS = 12;

    public List<TimeSlotRecommendation> getRecommendedSlots(
            Long userId, Long serviceId, Long preferredStaffId, LocalDate bookingDate) {

        // 1. Get Service Duration
        ServiceModel service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new RuntimeException("Service not found"));
        int duration = service.getDurationMinutes();

        // 2. Determine Staff Pool
        List<Staff> eligibleStaff = (preferredStaffId != null && preferredStaffId != 0)
                ? List.of(staffRepository.findWithDetailsById(preferredStaffId).orElseThrow(() -> new RuntimeException("Staff not found")))
                : staffRepository.findByServiceId(serviceId);

        if (eligibleStaff.isEmpty()) return Collections.emptyList();
        List<Long> staffIds = eligibleStaff.stream().map(Staff::getId).toList();

        // 3. Bulk Fetch Data (Efficiency)
        Map<Long, List<Appointment>> appointmentsMap = appointmentRepository
                .findAllByStaffIdInAndBookingDate(staffIds, bookingDate)
                .stream().collect(Collectors.groupingBy(a -> a.getStaff().getId()));

        Map<Long, StaffWorkingHours> workingHoursMap = workingHoursRepository
                .findAllByStaffIdInAndDayOfWeek(staffIds, bookingDate.getDayOfWeek())
                .stream().collect(Collectors.toMap(wh -> wh.getStaff().getId(), wh -> wh));

        Map<Long, StaffLeave> leavesMap = leaveRepository
                .findAllByStaffIdInAndLeaveDate(staffIds, bookingDate)
                .stream().collect(Collectors.toMap(l -> l.getStaff().getId(), l -> l));

        UserBookingHistory history = historyRepository.findByUserId(userId).orElse(null);

        // 4. Generate & Score Slots
        List<ScoredTimeSlot> candidateSlots = new ArrayList<>();
        LocalTime nowBuffer = (bookingDate.equals(LocalDate.now())) ? LocalTime.now().plusMinutes(30) : null;

        for (Staff staff : eligibleStaff) {
            StaffWorkingHours wh = workingHoursMap.get(staff.getId());
            if (wh == null || !wh.isWorkingDay()) continue;

            // Combine appointments and partial leaves into blocked intervals
            List<TimeInterval> blocked = new ArrayList<>();
            List<Appointment> currentAppts = appointmentsMap.getOrDefault(staff.getId(), new ArrayList<>());
            currentAppts.forEach(a -> blocked.add(new TimeInterval(a.getStartTime(), a.getEndTime())));

            StaffLeave leave = leavesMap.get(staff.getId());
            if (leave != null) {
                if (leave.getStartTime() == null || leave.getEndTime() == null) continue; // Full day leave
                blocked.add(new TimeInterval(leave.getStartTime(), leave.getEndTime())); // Partial leave
            }

            LocalTime current = wh.getStartTime();
            while (!current.plusMinutes(duration).isAfter(wh.getEndTime())) {
                LocalTime end = current.plusMinutes(duration);

                if (isSlotFree(current, end, nowBuffer, blocked)) {
                    ScoredTimeSlot slot = new ScoredTimeSlot(bookingDate, current, end, staff);
                    calculateFullScore(slot, history, currentAppts.size());
                    candidateSlots.add(slot);
                }
                current = current.plusMinutes(SLOT_INTERVAL);
            }
        }

        // 5. Rank and Map to DTO
        return candidateSlots.stream()
                .sorted(Comparator.comparingDouble(ScoredTimeSlot::getTotalScore).reversed())
                .limit(MAX_SLOTS)
                .map(this::mapToRecommendation)
                .toList();
    }

    private boolean isSlotFree(LocalTime start, LocalTime end, LocalTime buffer, List<TimeInterval> blocked) {
        if (buffer != null && start.isBefore(buffer)) return false;
        for (TimeInterval b : blocked) {
            if (start.isBefore(b.end()) && end.isAfter(b.start())) return false;
        }
        return true;
    }

    private void calculateFullScore(ScoredTimeSlot slot, UserBookingHistory history, int apptCount) {
        double pScore = calculatePreferenceScore(slot.getStartTime(), history);
        double wScore = Math.max(0, 1.0 - ((double) apptCount / MAX_DAILY_APPOINTMENTS));
        double tScore = calculateTimeFitScore(slot.getStartTime(), history);

        slot.setPreferenceScore(pScore);
        slot.setWorkloadScore(wScore);
        slot.setTimeFitScore(tScore);
        slot.setTotalScore((ALPHA * pScore) + (BETA * wScore) + (GAMMA * tScore));
    }

    private double calculatePreferenceScore(LocalTime time, UserBookingHistory history) {
        if (history == null || history.getPreferenceVector() == null) return 0.5;
        double[] userPref = history.getPreferenceVector(); // Expected [Morning, Afternoon, Evening]
        double[] currentSlot = getTimePeriodVector(time);

        double dot = 0, normA = 0, normB = 0;
        for (int i = 0; i < 3; i++) {
            dot += userPref[i] * currentSlot[i];
            normA += Math.pow(userPref[i], 2);
            normB += Math.pow(currentSlot[i], 2);
        }
        return (normA == 0 || normB == 0) ? 0.5 : dot / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    private double calculateTimeFitScore(LocalTime time, UserBookingHistory history) {
        if (history == null || history.getAvgBookingTime() == null) return 0.5;
        long diff = Math.abs(Duration.between(history.getAvgBookingTime(), time).toMinutes());
        return Math.exp(-LAMBDA * diff);
    }

    private double[] getTimePeriodVector(LocalTime time) {
        int h = time.getHour();
        if (h < 12) return new double[]{1, 0, 0}; // Morning
        if (h < 17) return new double[]{0, 1, 0}; // Afternoon
        return new double[]{0, 0, 1};           // Evening
    }

    private TimeSlotRecommendation mapToRecommendation(ScoredTimeSlot slot) {
        int finalScore = (int) (slot.getTotalScore() * 100);
        return TimeSlotRecommendation.builder()
                .appointmentDate(slot.getAppointmentDate())
                .startTime(slot.getStartTime())
                .endTime(slot.getEndTime())
                .staff(new StaffSummaryResponse(slot.getStaff().getId(),
                        slot.getStaff().getUser().getFullName(),
                        slot.getStaff().getUser().getProfileUrl(),
                        slot.getStaff().getExpertiseIn())
                )
                .matchScore(finalScore)
                .preferenceScore((int) (slot.getPreferenceScore() * 100))
                .workloadScore((int) (slot.getWorkloadScore() * 100))
                .timeFitScore((int) (slot.getTimeFitScore() * 100))
                .matchLabel(LabelHelper.getLabel(finalScore))
                .isTopPick(finalScore >= 85)
                .build();
    }



}


