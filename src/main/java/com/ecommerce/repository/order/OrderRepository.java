package com.ecommerce.repository.order;

import com.ecommerce.model.order.OrderModel;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<OrderModel, Long> {

    @EntityGraph(value = "Order.user", type = EntityGraph.EntityGraphType.LOAD)
    @Query("Select o from OrderModel o")
    List<OrderModel> findAllOrdersWithUsername();

    @EntityGraph(value = "Order.user", type = EntityGraph.EntityGraphType.LOAD)
    @Query("""
        select o from OrderModel o
        where o.user.id = :userId
        order by o.createdAt desc
    """)
    List<OrderModel> findByUserId(@Param("userId") Long userId);

    @EntityGraph(value = "Order.orderItems.product.images.user.address.payment", type = EntityGraph.EntityGraphType.LOAD)
    @Query("SELECT o FROM OrderModel o where o.id = :orderId")
    Optional<OrderModel> findDetailsOfOrderById(@Param("orderId") Long orderId);


}
