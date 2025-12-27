package com.ecommerce.model.payment;

import com.ecommerce.model.order.OrderModel;
import com.ecommerce.model.service.Appointment;
import com.ecommerce.model.user.UserModel;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;


//from payment admin sees who has paid and for what
@NamedEntityGraph(
        name = "Payment.order.user.appointment",
        attributeNodes = {
                @NamedAttributeNode("order"),
                @NamedAttributeNode("appointment"),
                @NamedAttributeNode("user")
        }
)

@Entity
@Table(name = "payments")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PaymentModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private OrderModel order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserModel user;

    @OneToOne(fetch =FetchType.LAZY)
    @JoinColumn(name = "appointment_id")
    private Appointment appointment;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(name = "transaction_id", unique = true, length = 255, nullable = false)
    private String transactionId;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false)
    private PaymentMethod paymentMethod;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false)
    private PaymentStatus paymentStatus;

    @Column(name = "payment_date", updatable = false)
    @CreationTimestamp
    private LocalDateTime paymentDate;

    @Column(name = "error_code", length = 50)
    private String errorCode;


}