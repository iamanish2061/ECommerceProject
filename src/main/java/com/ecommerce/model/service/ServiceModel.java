package com.ecommerce.model.service;

import com.ecommerce.model.user.Staff;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;

//for listing all services use simple findAll()

// for admin side, staff and user : each services details
@NamedEntityGraph(
        name = "Service.staff.user",
        attributeNodes = @NamedAttributeNode(value = "staff", subgraph = "staffGraph"),
        subgraphs = {
                @NamedSubgraph(
                        name = "staffGraph",
                        attributeNodes = @NamedAttributeNode("user")
                )

        }
)
@Entity
@Table(name = "services")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@Builder
public class ServiceModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    @NotBlank
    private String name;  // e.g., "Men's Haircut" or "Facial Cleanup"

    private String description;  // Optional detailed description

    @Column(nullable = false)
    private BigDecimal price;

    @Column(nullable = false)
    private String imageUrl;

    @Column(nullable = false)
    private Integer durationMinutes;  // e.g., 45 for a haircut

    private String category;  // e.g., "Hair", "Skin", "Nails", "Waxing" – for grouping in UI

    private boolean active = true;  // To enable/disable services

    @ManyToMany(mappedBy = "services", fetch = FetchType.LAZY)
    @JsonIgnoreProperties("services")
    private Set<Staff> staff = new HashSet<>();
}
