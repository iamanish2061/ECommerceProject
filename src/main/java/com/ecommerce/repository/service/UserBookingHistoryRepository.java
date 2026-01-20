package com.ecommerce.repository.service;

import com.ecommerce.model.service.UserBookingHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserBookingHistoryRepository extends JpaRepository<UserBookingHistory, Long> {

    Optional<UserBookingHistory> findByUserId(Long userId);

    boolean existsByUserId(Long userId);
}
