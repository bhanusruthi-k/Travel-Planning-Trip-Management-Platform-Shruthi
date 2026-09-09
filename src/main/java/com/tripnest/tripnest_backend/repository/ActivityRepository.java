package com.tripnest.tripnest_backend.repository;

import com.tripnest.tripnest_backend.model.Activity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ActivityRepository extends JpaRepository<Activity, Long> {

    List<Activity> findByItineraryDayIdOrderByIdAsc(Long itineraryDayId);

    @Query("SELECT a FROM Activity a JOIN FETCH a.itineraryDay d JOIN FETCH d.trip t LEFT JOIN FETCH t.user " +
           "WHERE d.date = :targetDate AND t.status != com.tripnest.tripnest_backend.model.TripStatus.CANCELLED")
    List<Activity> findActivitiesScheduledForDate(@Param("targetDate") LocalDate targetDate);

    @org.springframework.data.jpa.repository.Modifying
    @Query("DELETE FROM Activity a WHERE a.itineraryDay.trip.id = :tripId")
    void deleteByTripId(@Param("tripId") Long tripId);
}
