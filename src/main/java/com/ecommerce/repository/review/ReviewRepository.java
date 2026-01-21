package com.ecommerce.repository.review;

import com.ecommerce.model.review.Review;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    @EntityGraph(value = "Review.user", type = EntityGraph.EntityGraphType.FETCH)
    List<Review> findTop5ByOrderByRatingDesc();

    @EntityGraph(value = "Review.user", type = EntityGraph.EntityGraphType.FETCH)
    List<Review> findAllByOrderByCreatedAtDesc();

    @EntityGraph(value = "Review.user", type = EntityGraph.EntityGraphType.FETCH)
    List<Review> findByUserId(Long userId);

    @EntityGraph(value = "Review.user", type = EntityGraph.EntityGraphType.FETCH)
    @Query("SELECT r FROM Review r WHERE r.id = :id")
    Optional<Review> findByReviewId(@Param("id") Long id);

}
