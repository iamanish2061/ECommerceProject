package com.ecommerce.repository.service;

import com.ecommerce.model.service.LeaveStatus;
import com.ecommerce.model.service.StaffLeave;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface StaffLeaveRepository extends JpaRepository<StaffLeave, Long> {

//    to fetch pending leave request to display on admin dashboard
    @EntityGraph(value = "Leave.staff.user", type = EntityGraph.EntityGraphType.FETCH)
    List<StaffLeave> findByStatus(LeaveStatus status);

    // Get all leaves for a staff member
    List<StaffLeave> findByStaffIdOrderByLeaveDateDesc(Long staffId);

    // Finds a StaffLeave record by the primary ID and the ID of the associated Staff
    Optional<StaffLeave> findByIdAndStaffId(Long id, Long staffId);

    // Check if staff has leave on a specific date
    Optional<StaffLeave> findByStaffIdAndLeaveDate(Long staffId, LocalDate leaveDate);

    // Get upcoming leaves
    @Query("SELECT sl FROM StaffLeave sl WHERE sl.staff.id = :staffId " +
            "AND sl.leaveDate >= :today ORDER BY sl.leaveDate ASC")
    List<StaffLeave> findUpcomingLeaves(
            @Param("staffId") Long staffId,
            @Param("today") LocalDate today);


    @Query("SELECT l FROM StaffLeave l WHERE l.staff.id IN :staffIds AND l.leaveDate = :leaveDate")
    List<StaffLeave> findAllByStaffIdInAndLeaveDate(
            @Param("staffIds") List<Long> staffIds,
            @Param("leaveDate") LocalDate leaveDate);

}
