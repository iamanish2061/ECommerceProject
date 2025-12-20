package com.ecommerce.model.order;


import com.ecommerce.model.payment.PaymentModel;
import com.ecommerce.model.user.AddressModel;
import com.ecommerce.model.user.UserModel;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

//viewing order details from admin side
@NamedEntityGraph(
        name = "Order.orderItems.product.images.user.address.payment",
        attributeNodes = {
                @NamedAttributeNode(value= "orderItems", subgraph = "orderItemsGraph"),
                @NamedAttributeNode("user"),
                @NamedAttributeNode("address"),
                @NamedAttributeNode("payment")
        },
        subgraphs = {
                @NamedSubgraph(
                        name = "orderItemsGraph",
                        attributeNodes = {
                                @NamedAttributeNode(value = "product", subgraph = "productGraph")
                        }
                ),
                @NamedSubgraph(
                        name = "productGraph",
                        attributeNodes = {
                                @NamedAttributeNode("images")
                        }
                )
        }
)

//viewing orderDetails by particular user
@NamedEntityGraph(
        name = "Order.orderItems.product.images.address.payment",
        attributeNodes = {
                @NamedAttributeNode(value = "orderItems", subgraph = "orderItemsGraph"),
                @NamedAttributeNode("address"),
                @NamedAttributeNode("payment")
        },
        subgraphs = {
                @NamedSubgraph(
                        name= "orderItemsGraph",
                        attributeNodes = {
                                @NamedAttributeNode(value = "product", subgraph = "productGraph")
                        }
                ),
                @NamedSubgraph(
                        name = "productGraph",
                        attributeNodes = {
                                @NamedAttributeNode(value = "images")
                        }
                )
        }
)
@Entity
@Table(name = "orders")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
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

    @Column(name = "created_at", updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonIgnoreProperties("order")
    @Builder.Default
    private Set<OrderItem> orderItems = new HashSet<>();

    @OneToOne(
            fetch = FetchType.LAZY,
            cascade = CascadeType.ALL
    )
    @JoinColumn(name = "address_id")
    private AddressModel address;

    @OneToOne(
            mappedBy = "order",
            cascade = CascadeType.ALL,
            fetch = FetchType.LAZY,
            orphanRemoval = true
    )
    private PaymentModel payment;


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


//    helper method for payment
    public void addPayment(PaymentModel payment){
        if(payment != null){
            this.payment = payment;
            payment.setOrder(this);
        }
    }
    public void removePayment(PaymentModel payment){
        if(payment != null){
            this.payment = null;
            payment.setOrder(null);
        }
    }

}
