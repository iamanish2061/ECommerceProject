package com.ecommerce.repository.payment;

import com.ecommerce.model.payment.PaymentModel;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<PaymentModel, Long> {

    Optional<PaymentModel> findByTransactionId(String transactionId);

    @Query("SELECT SUM(p.amount) FROM PaymentModel p")
    BigDecimal getTotalRevenue();

    @EntityGraph(value = "Payment.order.user.appointment", type = EntityGraph.EntityGraphType.FETCH)
    @Query("SELECT p FROM PaymentModel p ORDER BY p.paymentDate DESC")
    List<PaymentModel> findAllPayments();

    @EntityGraph(value = "Payment.order.user.appointment", type = EntityGraph.EntityGraphType.FETCH)
    @Query("SELECT p FROM PaymentModel p where p.id = :paymentId")
    Optional<PaymentModel> findDetailById(@Param("paymentId") Long paymentId);


}
