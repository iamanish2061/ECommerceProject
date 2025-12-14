package com.ecommerce.model.order;


import com.ecommerce.model.user.UserModel;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderModel {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserModel user;

    @Column(name = "total_amount", nullable = false)
    private BigDecimal totalAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status = OrderStatus.PENDING;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonIgnoreProperties("order")
    @Builder.Default
    private List<OrderItem> orderItems = new ArrayList<>();



    //    helper method for orderItems
    public void addOrderItem(OrderItem orderItem){
        if(orderItem != null){
            this.orderItems.add(orderItem);
            orderItem.setOrder(this);
        }
    }

    public void removeOrderItem(OrderItem item) {
        if(item != null){
            orderItems.remove(item);
            item.setOrder(null);
        }
    }


}
