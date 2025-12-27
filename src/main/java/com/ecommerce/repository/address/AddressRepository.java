package com.ecommerce.repository.address;

import com.ecommerce.model.user.AddressModel;
import com.ecommerce.model.user.AddressType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AddressRepository extends JpaRepository<AddressModel, Long> {

    Optional<AddressModel> findByUserIdAndType(Long userId, AddressType type);


}
