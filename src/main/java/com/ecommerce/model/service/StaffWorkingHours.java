package com.ecommerce.model.service;

import com.ecommerce.model.user.Staff;
import jakarta.persistence.*;
import lombok.*;

import java.time.DayOfWeek;
import java.time.LocalTime;

@Entity
@Table(name = "staff_working_hours", uniqueConstraints = @UniqueConstraint(columnNames = { "staff_id", "day_of_week" }))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StaffWorkingHours {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staff_id", nullable = false)
    private Staff staff;

    @Enumerated(EnumType.STRING)
    @Column(name = "day_of_week", nullable = false)
    private DayOfWeek dayOfWeek;

    @Column(name = "start_time")
    private LocalTime startTime;

    @Column(name = "end_time")
    private LocalTime endTime;

    @Column(name = "is_working_day", nullable = false)
    private boolean isWorkingDay = true;
}
