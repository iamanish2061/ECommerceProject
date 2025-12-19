package com.ecommerce.repository.product;

import com.ecommerce.model.product.ProductModel;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<ProductModel, Long> {

    @EntityGraph(value = "Product.images.tags", type = EntityGraph.EntityGraphType.LOAD)
    @Query("SELECT p FROM ProductModel p JOIN p.tags t WHERE t.slug = :tagSlug")
    List<ProductModel> findAllWithImageFromTagSlug(@Param("tagSlug") String tagSlug);

    @EntityGraph(value = "Product.images.brand", type = EntityGraph.EntityGraphType.LOAD)
    @Query("SELECT p FROM ProductModel p JOIN p.brand b WHERE b.slug = :brandSlug")
    List<ProductModel> findAllWithImageFromBrandSlug(@Param("brandSlug") String brandSlug);

    @EntityGraph(value = "Product.images.category.parent", type = EntityGraph.EntityGraphType.LOAD)
    @Query("SELECT p FROM ProductModel p JOIN p.category c WHERE c.slug = :categorySlug")
    List<ProductModel> findAllWithImageFromCategorySlug(@Param("categorySlug") String categorySlug);

    @EntityGraph(value = "Product.images", type = EntityGraph.EntityGraphType.LOAD)
    List<ProductModel> findAllProductsAndImages();

    @EntityGraph(value = "Product.images", type = EntityGraph.EntityGraphType.LOAD)
    List<ProductModel> findAllByIdIn(@Param("recommendedIds") List<Long> recommendedIds);

    @EntityGraph(value = "Product.images", type = EntityGraph.EntityGraphType.LOAD)
    List<ProductModel> findAllByIdNotIn(@Param("recommendedIds") List<Long> recommendedIds);

    @EntityGraph(value = "Product.images.brand.category.tags", type = EntityGraph.EntityGraphType.LOAD)
    Optional<ProductModel> findProductDetailsById(@Param("id") Long id);

}

