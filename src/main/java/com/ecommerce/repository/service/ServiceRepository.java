package com.ecommerce.repository.service;

import com.ecommerce.model.service.ServiceModel;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceRepository extends JpaRepository<ServiceModel, Long> {

    // For user listing - only active services
    List<ServiceModel> findByActiveTrue();

    // Filter by category
    List<ServiceModel> findByCategoryAndActiveTrue(String category);

    // All services for admin
    List<ServiceModel> findAllByOrderByIdDesc();

    // Find by name (for uniqueness check)
    Optional<ServiceModel> findByName(String name);

    // Get service with staff (for detail view)
    @EntityGraph("Service.staff.user")
    Optional<ServiceModel> findWithStaffById(Long id);

    // Search by name (case-insensitive)
    List<ServiceModel> findByNameContainingIgnoreCaseAndActiveTrue(String name);

    // Admin search - includes inactive
    List<ServiceModel> findByNameContainingIgnoreCase(String name);

    // Get distinct categories
    @Query("SELECT DISTINCT s.category FROM ServiceModel s WHERE s.active = true")
    List<String> findDistinctCategories();

    // Check if name exists (for validation)
    boolean existsByNameIgnoreCase(String name);
}
