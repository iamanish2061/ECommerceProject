package com.ecommerce.repository.address;

import com.ecommerce.model.address.DeliveryAddress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DeliveryAddressRepository extends JpaRepository<DeliveryAddress, Long> {
}
