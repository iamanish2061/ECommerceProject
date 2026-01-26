package com.ecommerce.dto.intermediate.appointment;

import com.ecommerce.model.user.Staff;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
public class ScoredTimeSlot {
    private final LocalDate appointmentDate;
    private final LocalTime startTime;
    private final LocalTime endTime;
    private final Staff staff;
    private double preferenceScore;
    private double workloadScore;
    private double timeFitScore;
    private double totalScore;
    private String matchLabel;

    public ScoredTimeSlot(LocalDate date, LocalTime start, LocalTime end, Staff staff) {
        this.appointmentDate = date;
        this.startTime = start;
        this.endTime = end;
        this.staff = staff;
    }
}
