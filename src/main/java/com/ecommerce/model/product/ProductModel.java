package com.ecommerce.model.product;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.BatchSize;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static jakarta.persistence.CascadeType.ALL;
import static jakarta.persistence.FetchType.LAZY;
import static jakarta.persistence.GenerationType.IDENTITY;

// for fetching all products from admin side and user side with brief info
@NamedEntityGraph(
        name = "Product.images",
        attributeNodes = @NamedAttributeNode("images")
)

//for admin side , fetching list of products from brand
// for user side
// fetching products from particular brand
@NamedEntityGraph(
        name = "Product.images.brand",
        attributeNodes = {
                @NamedAttributeNode("images"),
                @NamedAttributeNode("brand")
        }
)

//same as brand
//for admin fetching list of products from category
//for user fetching list of products of specific category
@NamedEntityGraph(
        name = "Product.images.category.parent",
        attributeNodes = {
                @NamedAttributeNode(value = "category", subgraph = "categoryGraph"),
                @NamedAttributeNode("images")
        },
        subgraphs = {
                @NamedSubgraph(
                        name = "categoryGraph",
                        attributeNodes = @NamedAttributeNode("parent")
                )
        }
)

//same as category but of tag
@NamedEntityGraph(
        name = "Product.images.tags",
        attributeNodes = {
                @NamedAttributeNode("tags"),
                @NamedAttributeNode("images")
        }
)

//fetching details of a product in admin and user side
@NamedEntityGraph(
        name = "Product.images.brand.category.tags",
        attributeNodes = {
                @NamedAttributeNode("brand"),
                @NamedAttributeNode("category"),
                @NamedAttributeNode("tags"),
                @NamedAttributeNode("images")
        }
)

//findind product with tags only for adding and removing purose
@NamedEntityGraph(
        name = "Product.tags",
        attributeNodes = @NamedAttributeNode("tags")
)

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(
        name = "products",
        uniqueConstraints = @UniqueConstraint(
                columnNames = {"title", "brand_id"}
        ),
        indexes = {
            @Index(name = "idx_slug", columnList = "slug", unique = true),
            @Index(name = "idx_category", columnList = "category_id"),
            @Index(name = "idx_brand", columnList = "brand_id")
        }
)
public class ProductModel {
    @Id
    @GeneratedValue(strategy = IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 60)
    private String sku;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(nullable = false, unique = true, length = 300)
    private String slug;

    @Column(columnDefinition = "TEXT")
    private String shortDescription;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = LAZY)
    @JoinColumn(name = "brand_id", nullable = false)
    @JsonIgnoreProperties("products")
    private BrandModel brand;

    @ManyToOne(fetch = LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    @JsonIgnoreProperties("products")
    private CategoryModel category;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal costPrice;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal sellingPrice;

    private Integer stock = 0;

    @Column(name = "size_ml", length = 30)
    private String sizeMl;

    private boolean active = true;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "product", cascade = ALL, orphanRemoval = true, fetch = LAZY)
    @JsonIgnoreProperties("product")
    @BatchSize(size = 5)
    private Set<ProductImageModel> images = new HashSet<>();

    @ManyToMany(
            fetch = LAZY,
            cascade = CascadeType.MERGE
    )
    @JoinTable(
            name = "product_tags",
            joinColumns = @JoinColumn(name = "product_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id"),
            uniqueConstraints = @UniqueConstraint(
                    columnNames = {"product_id", "tag_id"}
            )
    )
    @JsonIgnoreProperties("products")
    private Set<TagModel> tags = new HashSet<>();

//    helper method for images
    public void addImage(ProductImageModel image){
        if(image != null){
            this.images.add(image);
            image.setProduct(this);
        }
    }

    public void removeImage(ProductImageModel image){
        if(image != null){
            this.images.remove(image);
            image.setProduct(null);
        }
    }

//    helper method for tags
    public void addTag(TagModel tag){
        if(tag != null){
            this.tags.add(tag);
            tag.getProducts().add(this);
        }
    }

    public void removeTag(TagModel tag){
        if(tag != null){
            this.tags.remove(tag);
            tag.getProducts().remove(this);
        }
    }

    public void addTags(Set<TagModel> tagList){
        if(!tagList.isEmpty()){
            this.tags.addAll(tagList);
            tagList.forEach(tag-> tag.getProducts().add(this));
        }
    }


}
