package com.tripnest.tripnest_backend.repository;

import com.tripnest.tripnest_backend.model.Activity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ActivityRepository extends JpaRepository<Activity, Long> {

    List<Activity> findByItineraryDayIdOrderByIdAsc(Long itineraryDayId);
}
