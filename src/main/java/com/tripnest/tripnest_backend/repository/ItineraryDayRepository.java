package com.tripnest.tripnest_backend.repository;

import com.tripnest.tripnest_backend.model.ItineraryDay;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ItineraryDayRepository extends JpaRepository<ItineraryDay, Long> {

    List<ItineraryDay> findByTripIdOrderByDayNumberAsc(Long tripId);

    @Query("SELECT d FROM ItineraryDay d LEFT JOIN FETCH d.activities WHERE d.trip.id = :tripId ORDER BY d.dayNumber ASC")
    List<ItineraryDay> findByTripIdWithActivitiesOrderByDayNumberAsc(@Param("tripId") Long tripId);

    Optional<ItineraryDay> findByIdAndTripId(Long id, Long tripId);
}
