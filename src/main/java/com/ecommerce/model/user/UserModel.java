package com.ecommerce.model.user;

import com.ecommerce.model.order.OrderModel;
import com.ecommerce.model.service.Appointment;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.NaturalId;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@Builder
@Table(name = "users",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = "username"),
                @UniqueConstraint(columnNames = "email")
        }
)

@NamedEntityGraph(
        name = "User",
        attributeNodes = @NamedAttributeNode("addresses")
)
public class UserModel {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false, unique = true)
    @NaturalId
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Role role = Role.ROLE_USER;

    private String profileUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private UserStatus status = UserStatus.ACTIVE;

    private String refreshToken;

    @Column(nullable = false)
    private Instant tokenValidAfter;

    @Column(nullable = false, updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;

    @Column(nullable = false, updatable = false)
    @UpdateTimestamp
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @OneToOne(
            mappedBy = "user",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.LAZY
    )
    private Driver driver;

    @OneToOne(
            mappedBy = "user",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.LAZY
    )
    private Staff staff;

    @OneToMany(
            mappedBy = "user",
            fetch = FetchType.LAZY,
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    @JsonIgnoreProperties("user")
    private Set<OrderModel> orders = new HashSet<>();

    @OneToMany(
            mappedBy = "user",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.LAZY
    )
    private Set<AddressModel> addresses = new HashSet<>();

    @OneToMany(
            mappedBy = "customer",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.LAZY
    )
    private Set<Appointment> appointments = new HashSet<>();

//    helper method (driver)
    public void addDriver(Driver driver){
        if(driver != null){
            this.driver = driver;
            driver.setUser(this);
        }
    }

//    helper method (staff)
    public void addStaff(Staff staff){
        if(staff != null){
            this.staff = staff;
            staff.setUser(this);
        }
    }

//    helper method (Address)
    public void addAddress(AddressModel address){
        if(address != null){
            this.addresses.add(address);
            address.setUser(this);
        }
    }

//    helper method for orders
    public void addProducts(OrderModel order){
        if(order != null){
            this.orders.add(order);
            order.setUser(this);
        }
    }

//    helper method for appointment
    public void addAppointment(Appointment appointment){
        if(appointment != null){
            this.appointments.add(appointment);
            appointment.setCustomer(this);
        }
    }

}



