package com.tripnest.tripnest_backend.service;

import com.tripnest.tripnest_backend.dto.itinerary.ActivityRequestDTO;
import com.tripnest.tripnest_backend.dto.itinerary.ActivityResponseDTO;
import com.tripnest.tripnest_backend.dto.itinerary.ItineraryDayRequestDTO;
import com.tripnest.tripnest_backend.dto.itinerary.ItineraryDayResponseDTO;

import java.util.List;

public interface ItineraryService {

    ItineraryDayResponseDTO addDay(Long tripId, ItineraryDayRequestDTO dto, String userEmail);

    List<ItineraryDayResponseDTO> getItineraryForTrip(Long tripId, String userEmail);

    void deleteDay(Long tripId, Long dayId, String userEmail);

    ActivityResponseDTO addActivity(Long dayId, ActivityRequestDTO dto, String userEmail);

    ActivityResponseDTO updateActivity(Long activityId, ActivityRequestDTO dto, String userEmail);

    void deleteActivity(Long activityId, String userEmail);
}
