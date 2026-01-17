package com.ecommerce.repository.service;

import com.ecommerce.model.service.StaffWorkingHours;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.DayOfWeek;
import java.util.List;
import java.util.Optional;

@Repository
public interface StaffWorkingHoursRepository extends JpaRepository<StaffWorkingHours, Long> {

    // Get all working hours for a staff member
    List<StaffWorkingHours> findByStaffId(Long staffId);

    // Get working hours for a specific day
    Optional<StaffWorkingHours> findByStaffIdAndDayOfWeek(Long staffId, DayOfWeek dayOfWeek);

    // Delete all working hours for a staff (for bulk update)
    void deleteByStaffId(Long staffId);

    // Check if staff works on a specific day
    boolean existsByStaffIdAndDayOfWeekAndIsWorkingDayTrue(Long staffId, DayOfWeek dayOfWeek);
}
