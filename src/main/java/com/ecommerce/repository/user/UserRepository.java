package com.ecommerce.repository.user;

import com.ecommerce.model.user.UserModel;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<UserModel, Long> {

    Optional<UserModel> findByUsername(String username);
    Optional<UserModel> findByEmail(String email);

    boolean existsByEmail(String email);
    boolean existsByUsername(String username);

    @EntityGraph(value = "User.addresses", type = EntityGraph.EntityGraphType.LOAD)
    Optional<UserModel> findUserDetailWithAddressById(@Param("id") Long id);
}
