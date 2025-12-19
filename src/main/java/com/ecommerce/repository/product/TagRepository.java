package com.ecommerce.repository.product;

import com.ecommerce.model.product.TagModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
public interface TagRepository extends JpaRepository<TagModel, Long> {

    Optional<TagModel> findBySlug(String slug);

    Set<String> findSlugsBySlugIn(List<String> incomingSlugs);
}
