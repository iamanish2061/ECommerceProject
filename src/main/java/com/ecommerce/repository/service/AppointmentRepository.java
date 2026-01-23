package com.ecommerce.repository.service;

import com.ecommerce.model.service.Appointment;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    // Find staff bookings in date range (for slot availability check)
    @Query("SELECT a FROM Appointment a WHERE a.staff.id = :staffId " +
                    "AND a.status NOT IN ('CANCELLED', 'NO_SHOW') " +
                    "AND a.appointmentDate = :date")
    List<Appointment> findStaffBookingsByDate(
                    @Param("staffId") Long staffId,
                    @Param("date") LocalDate date);

    // 1. Fetch appointments for a list of staff members (for the optimized loop)
    // This uses your custom @Query to filter by date and multiple staff IDs
    @Query("SELECT a FROM Appointment a WHERE a.staff.id IN :staffIds " +
            "AND a.appointmentDate = :date AND a.status != 'CANCELLED'")
    List<Appointment> findAllByStaffIdInAndBookingDate(
            @Param("staffIds") List<Long> staffIds,
            @Param("date") LocalDate date
    );

    // Count staff appointments on a specific date (for workload calculation)
    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.staff.id = :staffId " +
                    "AND a.appointmentDate = :date " +
                    "AND a.status NOT IN ('CANCELLED', 'NO_SHOW')")
    int countStaffAppointmentsOnDate(
                    @Param("staffId") Long staffId,
                    @Param("date") LocalDate date);

    // User's appointments
    @EntityGraph("Appointment.customer.staff.user.service.payment")
    List<Appointment> findByCustomerIdOrderByAppointmentDateDesc(Long customerId);

    // Get appointment with full details
    @EntityGraph("Appointment.customer.staff.user.service.payment")
    Optional<Appointment> findWithDetailsById(Long id);

    // Check for overlapping bookings (to prevent double booking)
    @Query("SELECT COUNT(a) > 0 FROM Appointment a WHERE a.staff.id = :staffId " +
                    "AND a.appointmentDate = :date " +
                    "AND a.status NOT IN ('CANCELLED', 'NO_SHOW') " +
                    "AND (a.startTime < :end AND a.endTime > :start)")
    boolean existsOverlappingAppointment(
                    @Param("staffId") Long staffId,
                    @Param("date") LocalDate date,
                    @Param("start") java.time.LocalTime start,
                    @Param("end") java.time.LocalTime end);

    // All appointments for admin (with pagination support via Pageable)
    @EntityGraph("Appointment.customer.staff.service.payment")
    List<Appointment> findAllByOrderByAppointmentDateDesc();

    @EntityGraph(value = "Appointment.customer.service", type = EntityGraph.EntityGraphType.FETCH)
    @Query("SELECT a FROM Appointment a WHERE a.staff.id = :staffId " +
            "AND a.status IN ('PENDING', 'BOOKED') " +
            "AND (a.appointmentDate > :today OR (a.appointmentDate = :today AND a.startTime >= :now)) " +
            "ORDER BY a.appointmentDate ASC, a.startTime ASC")
    List<Appointment> findUpcomingOfStaff(
            @Param("staffId") Long staffId,
            @Param("today") LocalDate today,
            @Param("now") LocalTime now);

    @EntityGraph(value = "Appointment.customer.service", type = EntityGraph.EntityGraphType.FETCH)
    @Query("SELECT a FROM Appointment a WHERE a.staff.id = :staffId " +
            "AND (a.appointmentDate < :today OR (a.appointmentDate = :today AND a.startTime <= :now)) " +
            "ORDER BY a.appointmentDate DESC, a.startTime DESC")
    List<Appointment> findHistoryOfStaffId(
            @Param("staffId") Long staffId,
            @Param("today") LocalDate today,
            @Param("now") LocalTime now);

    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.staff.id = :staffId " +
            "AND a.status IN ('PENDING', 'BOOKED') " +
            "AND (a.appointmentDate > :today OR (a.appointmentDate = :today AND a.startTime > :now))")
    long countUpcomingAppointmentsOfStaff(
            @Param("staffId") Long staffId,
            @Param("today") LocalDate today,
            @Param("now") LocalTime now);

    @EntityGraph(value = "Appointment.customer.staff.user.service.payment", type = EntityGraph.EntityGraphType.FETCH)
    List<Appointment> findTop5ByOrderByCreatedAtDesc();

}
