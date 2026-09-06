package com.tripnest.tripnest_backend.repository;

import com.tripnest.tripnest_backend.model.Trip;
import com.tripnest.tripnest_backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TripRepository extends JpaRepository<Trip, Long> {

    List<Trip> findByUser(User user);

    List<Trip> findByUserId(Long userId);

    Optional<Trip> findByIdAndUserId(Long id, Long userId);

    @Query("SELECT t FROM Trip t LEFT JOIN FETCH t.destination LEFT JOIN FETCH t.user WHERE t.user.id = :userId")
    List<Trip> findAllWithDetailsByUserId(@Param("userId") Long userId);

    @Query("SELECT t FROM Trip t LEFT JOIN FETCH t.destination LEFT JOIN FETCH t.user")
    List<Trip> findAllWithDetails();

    @Query("SELECT t FROM Trip t LEFT JOIN FETCH t.destination LEFT JOIN FETCH t.user WHERE t.id = :id")
    Optional<Trip> findByIdWithDetails(@Param("id") Long id);

    @Query("SELECT DISTINCT t FROM Trip t LEFT JOIN FETCH t.destination LEFT JOIN FETCH t.user " +
           "WHERE t.user.id = :userId OR t.id IN (SELECT tm.trip.id FROM TripMembership tm WHERE tm.user.id = :userId) " +
           "ORDER BY t.startDate DESC")
    List<Trip> findAllAccessibleByUserId(@Param("userId") Long userId);
}
