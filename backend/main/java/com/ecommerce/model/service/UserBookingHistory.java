package com.ecommerce.model.service;

import com.ecommerce.model.user.UserModel;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.time.LocalTime;

//Tracks user booking patterns for the recommendation algorithm.
//Used to calculate preference scores based on historical booking times.
@Entity
@Table(name = "user_booking_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserBookingHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private UserModel user;

    // Time preference counts (for preference vector calculation)
    @Column(name = "morning_count")
    @Builder.Default
    private Integer morningCount = 0; // 10AM - 12PM bookings

    @Column(name = "afternoon_count")
    @Builder.Default
    private Integer afternoonCount = 0; // 12PM - 5PM bookings

    @Column(name = "evening_count")
    @Builder.Default
    private Integer eveningCount = 0; // 5PM - 7PM bookings

    // Average booking time for time-fit scoring
    @Column(name = "avg_booking_time")
    private LocalTime avgBookingTime;

    // Total bookings count
    @Column(name = "total_bookings")
    @Builder.Default
    private Integer totalBookings = 0;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;


//     Returns the preference vector [morning, afternoon, evening] normalized.
    public double[] getPreferenceVector() {
        int total = morningCount + afternoonCount + eveningCount;
        if (total == 0) {
            return new double[] { 0.33, 0.34, 0.33 }; // Default uniform distribution
        }
        return new double[] {
                (double) morningCount / total,
                (double) afternoonCount / total,
                (double) eveningCount / total
        };
    }

//    Update counts based on a new booking time.
    public void recordBooking(LocalTime bookingTime) {
        int hour = bookingTime.getHour();
        if (hour >= 10 && hour < 12) {
            morningCount++;
        } else if (hour >= 12 && hour < 17) {
            afternoonCount++;
        } else {
            eveningCount++;
        }
        totalBookings++;
        updateAverageTime(bookingTime);
    }

    private void updateAverageTime(LocalTime newTime) {
        if (avgBookingTime == null) {
            avgBookingTime = newTime;
        } else {
            // Running average in minutes
            int currentMinutes = avgBookingTime.getHour() * 60 + avgBookingTime.getMinute();
            int newMinutes = newTime.getHour() * 60 + newTime.getMinute();
            int avgMinutes = (currentMinutes * (totalBookings - 1) + newMinutes) / totalBookings;
            avgBookingTime = LocalTime.of(avgMinutes / 60, avgMinutes % 60);
        }
    }
}
