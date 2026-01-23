package com.ecommerce.repository.user;

import com.ecommerce.model.user.Driver;
import com.ecommerce.model.user.VerificationStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DriverRepository extends JpaRepository<Driver, Long> {

    // Uses the NamedEntityGraph to fetch the User details in one join
    @EntityGraph(value = "Driver.user", type = EntityGraph.EntityGraphType.FETCH)
    List<Driver> findByVerified(VerificationStatus verified);


}
