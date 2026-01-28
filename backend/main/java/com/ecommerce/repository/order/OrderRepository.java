package com.ecommerce.repository.order;

import com.ecommerce.model.order.OrderModel;
import com.ecommerce.model.order.OrderStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<OrderModel, Long> {

    @EntityGraph(value = "Order.user", type = EntityGraph.EntityGraphType.FETCH)
    @Query("Select o from OrderModel o")
    List<OrderModel> findAllOrdersWithUsername();

    @EntityGraph(value = "Order.user", type = EntityGraph.EntityGraphType.FETCH)
    @Query("""
                select o from OrderModel o
                where o.user.id = :userId
                order by o.createdAt desc
            """)
    List<OrderModel> findByUserId(@Param("userId") Long userId);

    @EntityGraph(value = "Order.orderItems.product.images.user.address.payment", type = EntityGraph.EntityGraphType.FETCH)
    @Query("SELECT o FROM OrderModel o where o.id = :orderId")
    Optional<OrderModel> findDetailsOfOrderById(@Param("orderId") Long orderId);

    @Query("SELECT o from OrderModel o where o.user.id = :userId")
    List<OrderModel> findAllByUserId(@Param("userId") Long userId);

    @EntityGraph(value = "Order.orderItems.product.images.address.payment", type = EntityGraph.EntityGraphType.FETCH)
    @Query("SELECT o FROM OrderModel o where o.id = :orderId")
    Optional<OrderModel> findOrderOfUserInDetail(@Param("orderId") Long orderId);

    @EntityGraph(value = "Order.user", type = EntityGraph.EntityGraphType.FETCH)
    List<OrderModel> findTop5ByOrderByCreatedAtDesc();

    @EntityGraph(value = "Order.orderItems.product.images.user.address.payment", type = EntityGraph.EntityGraphType.FETCH)
    List<OrderModel> findByStatusIn(List<OrderStatus> statuses);

    @Query("SELECT SUM(o.totalAmount) FROM OrderModel o WHERE o.status IN :statuses")
    BigDecimal sumAmountByStatusIn(@Param("statuses") List<OrderStatus> statuses);

}
