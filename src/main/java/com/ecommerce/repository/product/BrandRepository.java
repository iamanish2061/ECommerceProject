package com.ecommerce.repository.product;

import com.ecommerce.model.product.BrandModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BrandRepository extends JpaRepository<BrandModel, Long> {
}
