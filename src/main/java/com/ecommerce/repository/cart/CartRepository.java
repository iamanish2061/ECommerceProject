package com.ecommerce.repository.cart;

import com.ecommerce.model.cart.CartModel;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CartRepository extends JpaRepository<CartModel, Long> {

    Optional<CartModel> findByUserIdAndProductId(Long userId, Long productId);

    Long countByUserId(Long userId);

    @EntityGraph(value = "CartItem.product.images", type = EntityGraph.EntityGraphType.LOAD)
    @Query("SELECT c from CartModel c where c.userId = :userId")
    List<CartModel> findCartItemsByUserId(@Param("userId") Long userId);

}
