package com.ecommerce.model.service;

import com.ecommerce.model.payment.PaymentModel;
import com.ecommerce.model.user.Staff;
import com.ecommerce.model.user.UserModel;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

//for admin: listing the appointments
@NamedEntityGraph(name = "Appointment.customer.staff.service.payment", attributeNodes = {
                @NamedAttributeNode("customer"),
                @NamedAttributeNode("staff"),
                @NamedAttributeNode("service"),
                @NamedAttributeNode("payment")
})

// for admin detailed:
// for user listing + user detailed
@NamedEntityGraph(name = "Appointment.customer.staff.user.service.payment", attributeNodes = {
                @NamedAttributeNode("customer"),
                @NamedAttributeNode(value = "staff", subgraph = "staffGraph"),
                @NamedAttributeNode("service"),
                @NamedAttributeNode("payment")
}, subgraphs = {
                @NamedSubgraph(name = "staffGraph", attributeNodes = @NamedAttributeNode(value = "user"))
})

// for staff listing +detailed
@NamedEntityGraph(name = "Appointment.customer.service", attributeNodes = {
                @NamedAttributeNode("customer"),
                @NamedAttributeNode("service"),
})

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Builder
@Table(name = "appointments", uniqueConstraints = @UniqueConstraint(columnNames = { "staff_id", "appointment_date",
                "start_time" }))
public class Appointment {

        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "user_id", nullable = false)
        private UserModel customer;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "staff_id", nullable = false)
        private Staff staff;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "service_id", nullable = true)
        private ServiceModel service;

        @Column(name = "appointment_date", nullable = false)
        private LocalDate appointmentDate;

        @Column(name = "start_time", nullable = false, columnDefinition = "TIME")
        private LocalTime startTime;

        @Column(name = "end_time", nullable = false, columnDefinition = "TIME")
        private LocalTime endTime;

        @Column(nullable = false)
        @Enumerated(EnumType.STRING)
        private AppointmentStatus status;

        private String specialNotes;

        private BigDecimal totalAmount;

        @OneToOne(mappedBy = "appointment", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
        private PaymentModel payment;

        @CreationTimestamp
        @Column(updatable = false)
        private LocalDateTime createdAt;

        @UpdateTimestamp
        private LocalDateTime updatedAt;


    //    helper method for payment
    public void addPayment(PaymentModel payment){
        if(payment != null){
            this.payment = payment;
            payment.setAppointment(this);
        }
    }
    public void removePayment(PaymentModel payment){
        if(payment != null){
            this.payment = null;
            payment.setAppointment(null);
        }
    }
}
