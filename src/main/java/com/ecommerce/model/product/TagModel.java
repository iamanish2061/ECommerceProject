package com.ecommerce.model.product;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;

import static jakarta.persistence.GenerationType.IDENTITY;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "tags")
public class TagModel {
    @Id
    @GeneratedValue(strategy = IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 60)
    private String name;

    @Column(nullable = false, unique = true, length = 70)
    private String slug;

    @ManyToMany(mappedBy = "tags", fetch = FetchType.LAZY)
    @JsonIgnoreProperties("tags")
    private Set<ProductModel> products = new HashSet<>();

    public TagModel(String name, String slug) {
        this.name = name;
        this.slug = slug;
    }
}
