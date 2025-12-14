package com.ecommerce.model.user;

import jakarta.persistence.*;
import org.hibernate.annotations.CurrentTimestamp;

import java.time.LocalDate;

@Entity
@Table(name = "staff")
public class Staff {

    @Id
    private Long id;   // SAME as user.id

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id", nullable = false)
    private UserModel user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StaffRole expertiseIn;

    @Enumerated(EnumType.STRING)
    private StaffRole secondarySkillIn;

    @Column(nullable = false)
    private boolean onLeave;

    @Column(nullable = false)
    @CurrentTimestamp
    private LocalDate joinedDate;

//    one to many relation with appointment
}

