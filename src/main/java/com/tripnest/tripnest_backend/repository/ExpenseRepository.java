package com.tripnest.tripnest_backend.repository;

import com.tripnest.tripnest_backend.dto.expense.CategoryExpenseSummaryDTO;
import com.tripnest.tripnest_backend.model.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    @Query("SELECT e FROM Expense e " +
           "LEFT JOIN FETCH e.trip " +
           "LEFT JOIN FETCH e.budget " +
           "LEFT JOIN FETCH e.payer " +
           "WHERE e.trip.id = :tripId " +
           "ORDER BY e.expenseDate DESC, e.createdAt DESC")
    List<Expense> findByTripIdOrderByExpenseDateDesc(@Param("tripId") Long tripId);

    @Query("SELECT e FROM Expense e " +
           "LEFT JOIN FETCH e.trip " +
           "LEFT JOIN FETCH e.budget " +
           "LEFT JOIN FETCH e.payer " +
           "WHERE e.id = :id")
    Optional<Expense> findByIdWithDetails(@Param("id") Long id);

    @Query("SELECT e FROM Expense e " +
           "LEFT JOIN FETCH e.trip " +
           "LEFT JOIN FETCH e.budget " +
           "LEFT JOIN FETCH e.payer " +
           "WHERE e.id = :id AND e.trip.id = :tripId")
    Optional<Expense> findByIdAndTripId(@Param("id") Long id, @Param("tripId") Long tripId);

    @Query("SELECT new com.tripnest.tripnest_backend.dto.expense.CategoryExpenseSummaryDTO(e.category, SUM(e.amount), COUNT(e)) " +
           "FROM Expense e WHERE e.trip.id = :tripId GROUP BY e.category")
    List<CategoryExpenseSummaryDTO> getCategorySummaryByTripId(@Param("tripId") Long tripId);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e WHERE e.trip.id = :tripId")
    BigDecimal getTotalSpentByTripId(@Param("tripId") Long tripId);

    long countByTripId(Long tripId);

    @Query("SELECT new com.tripnest.tripnest_backend.dto.expense.CategoryExpenseSummaryDTO(e.category, SUM(e.amount), COUNT(e)) " +
           "FROM Expense e WHERE e.trip.user.id = :userId GROUP BY e.category")
    List<CategoryExpenseSummaryDTO> getCategorySummaryByUserId(@Param("userId") Long userId);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e WHERE e.trip.user.id = :userId")
    BigDecimal getTotalSpentByUserId(@Param("userId") Long userId);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e")
    BigDecimal getTotalPlatformExpenses();

    @Query("SELECT e FROM Expense e " +
           "LEFT JOIN FETCH e.trip " +
           "LEFT JOIN FETCH e.budget " +
           "LEFT JOIN FETCH e.payer " +
           "ORDER BY e.expenseDate DESC, e.createdAt DESC")
    List<Expense> findAllWithDetails();

    @org.springframework.data.jpa.repository.Modifying
    @Query("DELETE FROM Expense e WHERE e.trip.id = :tripId")
    void deleteByTripId(@Param("tripId") Long tripId);
}
