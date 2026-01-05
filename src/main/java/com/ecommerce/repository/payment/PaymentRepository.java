package com.ecommerce.repository.payment;

import com.ecommerce.model.payment.PaymentModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<PaymentModel, Long> {

    Optional<PaymentModel> findByTransactionId(String transactionId);

    @Query("SELECT SUM(p.amount) FROM PaymentModel p")
    BigDecimal getTotalRevenue();
}
