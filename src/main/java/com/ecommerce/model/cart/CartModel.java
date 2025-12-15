package com.ecommerce.model.cart;

import com.ecommerce.model.product.ProductModel;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

//used while user views cart:: for displaying information
@NamedEntityGraph(
        name = "CartItem.product.images",
        attributeNodes = {
                @NamedAttributeNode(
                        value = "product",
                        subgraph = "productGraph"
                )
        },
        subgraphs = {
                @NamedSubgraph(
                        name = "productGraph",
                        attributeNodes = {
                                @NamedAttributeNode("images")
                        }
                )
        }
)
@Entity
@Table(
        name = "cart_items",
        uniqueConstraints = @UniqueConstraint(
                columnNames = {"user_id", "product_id"}
        )
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@Builder
public class CartModel {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "product_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "PRODUCT_FK")
    )
    private ProductModel product;

    @Column(nullable = false)
    private int quantity = 1;

    @Column(name = "created_at", updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    @UpdateTimestamp
    private LocalDateTime updatedAt;

}