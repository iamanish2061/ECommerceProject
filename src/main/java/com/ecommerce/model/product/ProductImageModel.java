package com.ecommerce.model.product;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import static jakarta.persistence.FetchType.LAZY;
import static jakarta.persistence.GenerationType.IDENTITY;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "product_images",
        uniqueConstraints = @UniqueConstraint(columnNames = {"alt_text", "url"}),
        indexes = {
        @Index(name = "idx_product_images_product_id", columnList = "product_id")
})
public class ProductImageModel {
    @Id
    @GeneratedValue(strategy = IDENTITY)
    private Long id;

    @ManyToOne(fetch = LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    @JsonIgnoreProperties("images")
    private ProductModel product;

    @Column(name="url", nullable = false, length = 500)
    private String url;

    @Column(name = "alt_text")
    private String altText;

    private boolean thumbnail = false;
}
