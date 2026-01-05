package com.ecommerce.model.user;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.CurrentTimestamp;
import org.hibernate.annotations.NaturalId;

import java.time.LocalDate;
import java.time.LocalDateTime;

@NamedEntityGraph(
        name = "Driver.user",
        attributeNodes = @NamedAttributeNode("user")
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@Entity @Builder
@Table(name = "drivers")
public class Driver {

    @Id
    private Long id;   // SAME as user id

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    @MapsId
    private UserModel user;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private VerificationStatus verified = VerificationStatus.PENDING;

    @Column(nullable = false, unique = true)
    @NaturalId
    private String licenseNumber;

    @Column(nullable = false)
    private LocalDate licenseExpiry;

    @Column(nullable = false, unique = true)
    private String vehicleNumber;

    @Column(nullable = false)
    private String licenseUrl;

    @CreationTimestamp
    @Column(nullable = false)
    private LocalDateTime submittedAt;

    private LocalDateTime verifiedAt;
}

