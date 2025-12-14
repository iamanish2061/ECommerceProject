package com.ecommerce.model.cart;

import com.ecommerce.model.product.ProductModel;
import com.ecommerce.model.user.UserModel;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "cart_items",
        uniqueConstraints = @UniqueConstraint(
                columnNames = {"user", "product"}
        )
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@Builder
public class CartModel {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "userId",
            nullable = false
    )
    private UserModel user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "productId",
            nullable = false
    )
    private ProductModel product;

    @Column(nullable = false)
    private int quantity = 1;

    @Column(name = "created_at")
    @CreationTimestamp
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    @UpdateTimestamp
    private LocalDateTime updatedAt = LocalDateTime.now();


}