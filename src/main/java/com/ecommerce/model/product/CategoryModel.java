package com.ecommerce.model.product;


import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;

import static jakarta.persistence.FetchType.LAZY;
import static jakarta.persistence.GenerationType.IDENTITY;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "categories")
public class CategoryModel {
    @Id
    @GeneratedValue(strategy = IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, unique = true, length = 120)
    private String slug;

    @ManyToOne(fetch = LAZY)
    @JoinColumn(name = "parent_id")
    @JsonIgnoreProperties("parent")
    private CategoryModel parent;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 10;

    @OneToMany(mappedBy = "category", fetch = LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties("category")
    private Set<ProductModel> products = new HashSet<>();

    //    helper methods
    public void addProduct(ProductModel productModel){
        if(productModel != null){
            this.products.add(productModel);
            productModel.setCategory(this);
        }
    }

    public void removeProduct(ProductModel productModel){
        if(productModel != null){
            this.products.remove(productModel);
            productModel.setCategory(null);
        }
    }
}
