package com.ecommerce.repository.service;

import com.ecommerce.model.service.StaffWorkingHours;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.DayOfWeek;
import java.util.List;
import java.util.Optional;

@Repository
public interface StaffWorkingHoursRepository extends JpaRepository<StaffWorkingHours, Long> {

    // Get all working hours for a staff member
    List<StaffWorkingHours> findByStaffId(Long staffId);

    // Delete all working hours for a staff (for bulk update)
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("delete from StaffWorkingHours s where s.staff.id = :staffId")
    void deleteByStaffId(@Param("staffId") Long staffId);


    @Query("SELECT s FROM StaffWorkingHours s WHERE s.staff.id IN :staffIds AND s.dayOfWeek = :dayOfWeek")
    List<StaffWorkingHours> findAllByStaffIdInAndDayOfWeek(
            @Param("staffIds") List<Long> staffIds,
            @Param("dayOfWeek") DayOfWeek dayOfWeek);
}
