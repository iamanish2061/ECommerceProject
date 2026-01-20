package com.ecommerce.service.recommendation;

import com.ecommerce.dto.response.service.TimeSlotRecommendation;
import com.ecommerce.dto.response.staff.StaffSummaryResponse;
import com.ecommerce.model.service.*;
import com.ecommerce.model.user.Staff;
import com.ecommerce.repository.service.*;
import com.ecommerce.repository.user.StaffRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.*;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Implements the appointment recommendation algorithm.
 * 
 * Scoring formula: TotalScore = α·PrefScore + β·LoadScore + γ·TimeFitScore
 * Where α + β + γ = 1
 */
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

    // Scoring weights
    private static final double ALPHA = 0.4; // Preference weight
    private static final double BETA = 0.3; // Workload balance weight
    private static final double GAMMA = 0.3; // Time-fit weight

    // Time decay factor for time-fit scoring
    private static final double LAMBDA = 0.05;

    // Slot generation interval (minutes)
    private static final int SLOT_INTERVAL = 15;

    // Maximum slots to return
    private static final int MAX_SLOTS = 10;

    // Maximum daily appointments per staff (for workload calculation)
    private static final int MAX_DAILY_APPOINTMENTS = 12;

    /**
     * Get recommended time slots for a service booking.
     */
    public List<TimeSlotRecommendation> getRecommendedSlots(
            Long userId,
            Long serviceId,
            Long preferredStaffId,
            LocalDate startDate,
            LocalDate endDate) {

        // 1. Get service duration
        ServiceModel service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new RuntimeException("Service not found"));
        int duration = service.getDurationMinutes();

        // 2. Determine eligible staff
        Set<Staff> eligibleStaff;
        if (preferredStaffId != null) {
            Staff preferred = staffRepository.findById(preferredStaffId)
                    .orElseThrow(() -> new RuntimeException("Staff not found"));
            eligibleStaff = Set.of(preferred);
        } else {
            eligibleStaff = new HashSet<>(staffRepository.findByServiceId(serviceId));
        }

        if (eligibleStaff.isEmpty()) {
            log.warn("No eligible staff found for service {}", serviceId);
            return Collections.emptyList();
        }

        // 3. Get user booking history for scoring
        UserBookingHistory history = historyRepository.findByUserId(userId)
                .orElse(null);

        // 4. Generate feasible slots for each staff and date
        List<TimeSlot> allSlots = new ArrayList<>();
        LocalDate currentDate = startDate;
        while (!currentDate.isAfter(endDate)) {
            for (Staff staff : eligibleStaff) {
                List<TimeSlot> staffSlots = generateFeasibleSlots(staff, currentDate, duration);
                allSlots.addAll(staffSlots);
            }
            currentDate = currentDate.plusDays(1);
        }

        // 5. Score each slot
        for (TimeSlot slot : allSlots) {
            scoreSlot(slot, history);
        }

        // 6. Sort by score and return top N
        return allSlots.stream()
                .sorted(Comparator.comparingDouble(TimeSlot::getScore).reversed())
                .limit(MAX_SLOTS)
                .map(this::toRecommendation)
                .collect(Collectors.toList());
    }

    /**
     * Generate feasible time slots for a staff member on a given date.
     */
    private List<TimeSlot> generateFeasibleSlots(Staff staff, LocalDate date, int duration) {
        List<TimeSlot> slots = new ArrayList<>();

        // Get working hours for this day
        DayOfWeek dayOfWeek = date.getDayOfWeek();
        Optional<StaffWorkingHours> workingHoursOpt = workingHoursRepository.findByStaffIdAndDayOfWeek(staff.getId(),
                dayOfWeek);

        if (workingHoursOpt.isEmpty() || !workingHoursOpt.get().isWorkingDay()) {
            return slots; // Not a working day
        }

        StaffWorkingHours workingHours = workingHoursOpt.get();
        LocalTime workStart = workingHours.getStartTime();
        LocalTime workEnd = workingHours.getEndTime();

        // Check for leave on this date
        Optional<StaffLeave> leaveOpt = leaveRepository.findByStaffIdAndLeaveDate(staff.getId(), date);
        if (leaveOpt.isPresent()) {
            StaffLeave leave = leaveOpt.get();
            if (leave.getStartTime() == null || leave.getEndTime() == null) {
                return slots; // Full day leave
            }
            // Partial leave - adjust working hours
            // For simplicity, we'll skip the leave period
        }

        // Get existing bookings for this staff on this date
        List<Appointment> existingBookings = appointmentRepository.findStaffBookingsByDate(
                staff.getId(), date);

        // Generate candidate start times at fixed intervals
        LocalTime candidateTime = workStart;
        while (candidateTime.plusMinutes(duration).compareTo(workEnd) <= 0) {
            LocalTime slotStart = candidateTime;
            LocalTime slotEnd = slotStart.plusMinutes(duration);

            // Check if slot is valid (no overlap with existing bookings)
            if (isSlotAvailable(slotStart, slotEnd, existingBookings)) {
                TimeSlot slot = TimeSlot.builder()
                        .date(date)
                        .start(slotStart)
                        .end(slotEnd)
                        .staffId(staff.getId())
                        .staffName(staff.getUser().getFullName())
                        .staffProfileUrl(staff.getUser().getProfileUrl())
                        .booked(false)
                        .build();
                slots.add(slot);
            }

            candidateTime = candidateTime.plusMinutes(SLOT_INTERVAL);
        }

        return slots;
    }

    /**
     * Check if a slot doesn't overlap with any existing booking.
     */
    private boolean isSlotAvailable(LocalTime slotStart, LocalTime slotEnd,
            List<Appointment> existingBookings) {
        for (Appointment booking : existingBookings) {
            LocalTime bookingStart = booking.getStartTime();
            LocalTime bookingEnd = booking.getEndTime();

            // Check for overlap: slot is available if it ends before booking starts
            // OR starts after booking ends
            if (!(slotEnd.compareTo(bookingStart) <= 0
                    || slotStart.compareTo(bookingEnd) >= 0)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Calculate scores for a time slot.
     */
    private void scoreSlot(TimeSlot slot, UserBookingHistory history) {
        double prefScore = calculatePreferenceScore(slot, history);
        double loadScore = calculateWorkloadScore(slot);
        double timeScore = calculateTimeFitScore(slot, history);

        slot.setPreferenceScore(prefScore);
        slot.setWorkloadScore(loadScore);
        slot.setTimeFitScore(timeScore);
        slot.setScore(ALPHA * prefScore + BETA * loadScore + GAMMA * timeScore);
    }

    /**
     * Calculate customer time preference similarity score.
     * Uses cosine similarity between user's preference vector and slot time period.
     */
    private double calculatePreferenceScore(TimeSlot slot, UserBookingHistory history) {
        if (history == null) {
            return 0.5; // Default score for new users
        }

        double[] userPref = history.getPreferenceVector();
        double[] slotPeriod = getTimePeriodVector(slot.getStart());

        // Cosine similarity
        double dotProduct = 0;
        double normA = 0;
        double normB = 0;
        for (int i = 0; i < 3; i++) {
            dotProduct += userPref[i] * slotPeriod[i];
            normA += userPref[i] * userPref[i];
            normB += slotPeriod[i] * slotPeriod[i];
        }

        if (normA == 0 || normB == 0)
            return 0.5;
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    /**
     * Get time period vector [morning, afternoon, evening].
     */
    private double[] getTimePeriodVector(LocalTime time) {
        int hour = time.getHour();
        if (hour >= 6 && hour < 12) {
            return new double[] { 1, 0, 0 }; // Morning
        } else if (hour >= 12 && hour < 17) {
            return new double[] { 0, 1, 0 }; // Afternoon
        } else {
            return new double[] { 0, 0, 1 }; // Evening
        }
    }

    /**
     * Calculate staff workload balance score.
     * Higher score for staff with fewer appointments on that day.
     */
    private double calculateWorkloadScore(TimeSlot slot) {
        int appointments = appointmentRepository.countStaffAppointmentsOnDate(
                slot.getStaffId(), slot.getDate());
        return 1.0 - ((double) appointments / MAX_DAILY_APPOINTMENTS);
    }

    /**
     * Calculate time fit score based on user's typical booking time.
     * Uses exponential decay.
     */
    private double calculateTimeFitScore(TimeSlot slot, UserBookingHistory history) {
        if (history == null || history.getAvgBookingTime() == null) {
            return 0.5; // Default for new users
        }

        LocalTime avgTime = history.getAvgBookingTime();
        LocalTime slotTime = slot.getStart();

        // Calculate difference in minutes
        long diffMinutes = Math.abs(Duration.between(avgTime, slotTime).toMinutes());

        // Exponential decay: e^(-λ * diff)
        return Math.exp(-LAMBDA * diffMinutes);
    }

    /**
     * Convert TimeSlot to recommendation DTO.
     */
    private TimeSlotRecommendation toRecommendation(TimeSlot slot) {
        int matchScore = (int) (slot.getScore() * 100);
        String matchLabel = getMatchLabel(matchScore);

        return TimeSlotRecommendation.builder()
                .appointmentDate(slot.getDate())
                .startTime(slot.getStart())
                .endTime(slot.getEnd())
                .staff(new StaffSummaryResponse(slot.getStaffId(), slot.getStaffName(), slot.getStaffProfileUrl(), null))
                .matchScore(matchScore)
                .preferenceScore((int) (slot.getPreferenceScore() * 100))
                .workloadScore((int) (slot.getWorkloadScore() * 100))
                .timeFitScore((int) (slot.getTimeFitScore() * 100))
                .matchLabel(matchLabel)
                .isTopPick(matchScore >= 85)
                .build();
    }

    private String getMatchLabel(int score) {
        if (score >= 90)
            return "Best Match";
        if (score >= 80)
            return "Great";
        if (score >= 70)
            return "Good";
        if (score >= 60)
            return "Fair";
        return "Available";
    }
}
