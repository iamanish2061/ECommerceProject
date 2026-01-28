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

    @Query("""
                SELECT SUM(p.amount)
                FROM PaymentModel p
                WHERE CAST(p.paymentDate AS date) = :date
            """)
    java.math.BigDecimal getRevenueByDate(@Param("date") java.time.LocalDate date);

    @Query("""
                SELECT SUM(p.amount)
                FROM PaymentModel p
                WHERE YEAR(p.paymentDate) = :year AND MONTH(p.paymentDate) = :month
            """)
    java.math.BigDecimal getRevenueByMonthAndYear(@Param("year") int year, @Param("month") int month);

}
