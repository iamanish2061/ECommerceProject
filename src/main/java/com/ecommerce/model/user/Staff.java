package com.ecommerce.model.user;

import com.ecommerce.model.service.Appointment;
import com.ecommerce.model.service.ServiceModel;
import com.ecommerce.model.service.StaffLeave;
import com.ecommerce.model.service.StaffWorkingHours;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CurrentTimestamp;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

//finding staff details to show to user, admin and staff (my info)
@NamedEntityGraph(name = "Staff.user.services", attributeNodes = {
        @NamedAttributeNode("services"),
        @NamedAttributeNode("user")
})

// while viewing info of staff in user part of dashboard
// seeing info of staff with its leave info
@NamedEntityGraph(name = "Staff.leave.services", attributeNodes = {
        @NamedAttributeNode("staffLeave"),
        @NamedAttributeNode("services")
})

@Builder
@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "staff")
public class Staff {
    @Id
    private Long id; // SAME as userId

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id", nullable = false)
    private UserModel user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StaffRole expertiseIn;

    @OneToMany(mappedBy = "staff", fetch = FetchType.LAZY, orphanRemoval = true, cascade = CascadeType.ALL)
    private List<StaffLeave> staffLeave;

    @OneToMany(mappedBy = "staff", fetch = FetchType.LAZY, orphanRemoval = true, cascade = CascadeType.ALL)
    private List<StaffWorkingHours> workingHours;

    @Column(nullable = false)
    @CurrentTimestamp
    private LocalDate joinedDate;

    @OneToMany(mappedBy = "staff", fetch = FetchType.LAZY, orphanRemoval = true, cascade = CascadeType.ALL)
    private Set<Appointment> appointments = new HashSet<>();

    @ManyToMany(fetch = FetchType.LAZY, cascade = CascadeType.MERGE)
    @JoinTable(name = "staff_service",
            joinColumns = @JoinColumn(name = "staff_id"), inverseJoinColumns = @JoinColumn(name = "service_id"),
            uniqueConstraints = @UniqueConstraint(columnNames = {
            "staff_id", "service_id" }))
    private Set<ServiceModel> services = new HashSet<>();

    // helper methods for appointment
    public void addAppointment(Appointment appointment) {
        if (appointment != null) {
            this.appointments.add(appointment);
            appointment.setStaff(this);
        }
    }

    public void removeAppointment(Appointment appointment) {
        if (appointment != null) {
            this.appointments.remove(appointment);
            appointment.setStaff(null);
        }
    }

    // helper method for services
    public void addService(ServiceModel service) {
        if (service != null) {
            this.services.add(service);
            service.getStaff().add(this);
        }
    }

    public void addServices(List<ServiceModel> services) {
        if (!services.isEmpty()) {
            this.services.addAll(services);
            services.forEach(service -> service.getStaff().add(this));
        }
    }

    public void removeService(ServiceModel service) {
        if (service != null) {
            this.services.remove(service);
            service.getStaff().remove(this);
        }
    }

    // helper for leave
    public void addLeave(StaffLeave leave) {
        if (leave != null) {
            this.staffLeave.add(leave);
            leave.setStaff(this);
        }
    }

    public void removeLeave(StaffLeave leave) {
        if (leave != null) {
            this.staffLeave.remove(leave);
            leave.setStaff(null);
        }
    }

}
