package com.ecommerce.repository.product;

import com.ecommerce.model.product.ProductModel;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<ProductModel, Long> {

    @EntityGraph(value = "Product.images", type = EntityGraph.EntityGraphType.LOAD)
    List<ProductModel> findAllByIdIn(@Param("recommendedIds") List<Long> recommendedIds);

}

