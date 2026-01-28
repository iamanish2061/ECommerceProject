package com.ecommerce.service.recommendation;

import com.ecommerce.exception.ApplicationException;
import com.ecommerce.model.service.UserBookingHistory;
import com.ecommerce.model.user.UserModel;
import com.ecommerce.repository.service.UserBookingHistoryRepository;
import com.ecommerce.repository.user.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.time.LocalTime;

@Component
@RequiredArgsConstructor
@Slf4j

public class UserAppointmentHistoryUpdater {

    private final UserBookingHistoryRepository historyRepository;
    private final UserRepository userRepository;

    @Async
    @Transactional
    public void updateUserAppointmentHistoryAsync(Long userId, LocalTime bookingStartTime) {
        try {
            UserBookingHistory history = historyRepository.findByUserId(userId)
                    .orElseGet(() -> {
                        UserModel user = userRepository.findById(userId)
                                .orElseThrow(() -> new ApplicationException("User not found", "USER_NOT_FOUND", HttpStatus.NOT_FOUND));
                        return UserBookingHistory.builder()
                                .user(user)
                                .morningCount(0)
                                .afternoonCount(0)
                                .eveningCount(0)
                                .totalBookings(0)
                                .build();
                    });

            history.recordBooking(bookingStartTime);
            historyRepository.save(history);

            log.info("Async: User booking history updated for user ID: {}", userId);
        } catch (Exception e) {
            log.error("Async Error: Failed to update booking history for user {}", userId, e);
        }
    }
}

