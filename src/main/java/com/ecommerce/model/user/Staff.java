package com.ecommerce.model.user;

import com.ecommerce.model.service.Appointment;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CurrentTimestamp;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

@Entity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@Table(name = "staff")
public class Staff {
    @Id
    private Long id;        // SAME as userId

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

    @OneToMany(
            mappedBy = "staff",
            fetch = FetchType.LAZY,
            orphanRemoval = true,
            cascade = CascadeType.ALL
    )
    private Set<Appointment> appointments = new HashSet<>();

}

