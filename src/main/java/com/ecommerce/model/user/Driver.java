package com.ecommerce.model.user;

import jakarta.persistence.*;
import org.hibernate.annotations.CurrentTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "drivers")
public class Driver {

    @Id
    private Long id;   // SAME as user id

    @OneToOne
    @MapsId
    @JoinColumn(name = "user_id")
    private UserModel user;

    @Column(nullable = false)
    private boolean verified = false;

    @Column(nullable = false, unique = true)
    private String licenseNumber;

    @Column(nullable = false)
    private LocalDate licenseExpiry;

    @Column(nullable = false, unique = true)
    private String vehicleNumber;

    @Column(nullable = false)
    private String licenseUrl;

    @CurrentTimestamp
    private LocalDateTime verifiedAt;
}

