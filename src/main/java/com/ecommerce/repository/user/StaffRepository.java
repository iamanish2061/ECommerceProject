package com.ecommerce.repository.user;

import com.ecommerce.model.user.Staff;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StaffRepository extends JpaRepository<Staff, Long> {

    @EntityGraph(value = "Staff.leave.services", type = EntityGraph.EntityGraphType.LOAD)
    Optional<Staff> findStaffDetailWithLeaveInfoById(Long id);

}
