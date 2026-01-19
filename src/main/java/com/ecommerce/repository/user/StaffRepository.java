package com.ecommerce.repository.user;

import com.ecommerce.model.user.Staff;
import com.ecommerce.model.user.StaffRole;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StaffRepository extends JpaRepository<Staff, Long> {

    @EntityGraph(value = "Staff.leave.services", type = EntityGraph.EntityGraphType.FETCH)
    Optional<Staff> findStaffDetailWithLeaveInfoById(Long id);

    // Get staff with user info (for listing)
    @EntityGraph(value = "Staff.user.services", type = EntityGraph.EntityGraphType.FETCH)
    List<Staff> findAllByOrderByIdDesc();

        // Get staff by user ID
    Optional<Staff> findByUserId(Long userId);

    // Get staff with user and service details
    @EntityGraph(value = "Staff.user.services", type = EntityGraph.EntityGraphType.FETCH)
    Optional<Staff> findWithDetailsById(Long id);


    // Find staff qualified for a specific service
    @Query("SELECT s FROM Staff s JOIN s.services srv WHERE srv.id = :serviceId")
    List<Staff> findByServiceId(@Param("serviceId") Long serviceId);

    // Search staff by name (via user)
    @EntityGraph(value = "Staff.user.services", type = EntityGraph.EntityGraphType.FETCH)
    @Query("SELECT s FROM Staff s JOIN s.user u WHERE " +
            "LOWER(u.fullName) LIKE LOWER(CONCAT('%', :name, '%')) OR " +
            "LOWER(u.username) LIKE LOWER(CONCAT('%', :name, '%'))")
    List<Staff> searchByName(@Param("name") String name);

    // Check if user is already staff
    boolean existsByUserId(Long userId);
}
