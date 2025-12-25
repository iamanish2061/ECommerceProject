package com.ecommerce.model.user;

import jakarta.persistence.*;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@Entity @Builder
@Table(
        name = "address",
        uniqueConstraints = @UniqueConstraint(
                columnNames = {"user_id", "type"}
        )
)
public class AddressModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserModel user;

    @Enumerated(EnumType.STRING)
    private AddressType type;

    @Column(nullable = false)
    private String province;

    @Column(nullable = false)
    private String district;

    @Column(nullable = false)
    private String place;

    @Column(nullable = false)
    private String landmark;


    private Double latitude;
    private Double longitude;
}

