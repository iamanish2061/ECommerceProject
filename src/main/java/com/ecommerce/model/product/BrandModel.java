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
@Table(name = "brands")
public class BrandModel {
    @Id
    @GeneratedValue(strategy = IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    @Column(nullable = false, unique = true, length = 120)
    private String slug;

    @Column(name = "logo_url")
    private String logoUrl;

    @OneToMany(mappedBy = "brand", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties("brand")
    private Set<ProductModel> products = new HashSet<>();

    //    helper methods
    public void addProduct(ProductModel productModel){
        if(productModel != null){
            this.products.add(productModel);
            productModel.setBrand(this);
        }
    }

    public void removeProduct(ProductModel productModel){
        if(productModel != null){
            this.products.remove(productModel);
            productModel.setBrand(null);
        }
    }
}
