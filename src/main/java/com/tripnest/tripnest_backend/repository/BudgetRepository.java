package com.tripnest.tripnest_backend.repository;

import com.tripnest.tripnest_backend.model.Budget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BudgetRepository extends JpaRepository<Budget, Long> {

    Optional<Budget> findByTripId(Long tripId);

    @Query("SELECT b FROM Budget b LEFT JOIN FETCH b.trip t LEFT JOIN FETCH t.user WHERE b.trip.id = :tripId")
    Optional<Budget> findByTripIdWithDetails(@Param("tripId") Long tripId);

    boolean existsByTripId(Long tripId);

    void deleteByTripId(Long tripId);
}
