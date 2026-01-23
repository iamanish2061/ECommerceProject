package com.ecommerce.model.service;

import com.ecommerce.model.user.Staff;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Getter @Setter @AllArgsConstructor @NoArgsConstructor

@NamedEntityGraph(
        name = "Leave.staff.user",
        attributeNodes = @NamedAttributeNode(value = "staff", subgraph = "staff-subgraph"),
        subgraphs = @NamedSubgraph(
                name = "staff-subgraph",
                attributeNodes = @NamedAttributeNode("user")
        )
)

@Table(name = "staff_leave",
uniqueConstraints = @UniqueConstraint(
        columnNames = {"staff_id", "leave_date"}
))
@Entity
public class StaffLeave {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staff_id", nullable = false)
    @JsonIgnoreProperties("staffLeave")
    private Staff staff;

    @Column(name = "leave_date", nullable = false)
    private LocalDate leaveDate;

    private LocalTime startTime;
    private LocalTime endTime;

    private String reason;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @Enumerated(EnumType.STRING)
    private LeaveStatus status;
}
