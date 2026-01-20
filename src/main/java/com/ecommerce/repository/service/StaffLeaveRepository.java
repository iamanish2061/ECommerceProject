package com.ecommerce.repository.service;

import com.ecommerce.model.service.StaffLeave;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface StaffLeaveRepository extends JpaRepository<StaffLeave, Long> {

    // Get all leaves for a staff member
    List<StaffLeave> findByStaffIdOrderByLeaveDateDesc(Long staffId);

    // Get leaves in date range (for availability checking)
    @Query("SELECT sl FROM StaffLeave sl WHERE sl.staff.id = :staffId " +
            "AND sl.leaveDate >= :startDate AND sl.leaveDate <= :endDate")
    List<StaffLeave> findByStaffIdAndDateRange(
            @Param("staffId") Long staffId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    // Check if staff has leave on a specific date
    Optional<StaffLeave> findByStaffIdAndLeaveDate(Long staffId, LocalDate leaveDate);

    // Get upcoming leaves
    @Query("SELECT sl FROM StaffLeave sl WHERE sl.staff.id = :staffId " +
            "AND sl.leaveDate >= :today ORDER BY sl.leaveDate ASC")
    List<StaffLeave> findUpcomingLeaves(
            @Param("staffId") Long staffId,
            @Param("today") LocalDate today);

    // Delete leave
    void deleteByIdAndStaffId(Long id, Long staffId);

    @Query("SELECT l FROM StaffLeave l WHERE l.staff.id IN :staffIds AND l.leaveDate = :leaveDate")
    List<StaffLeave> findAllByStaffIdInAndLeaveDate(
            @Param("staffIds") List<Long> staffIds,
            @Param("leaveDate") LocalDate leaveDate);
}
