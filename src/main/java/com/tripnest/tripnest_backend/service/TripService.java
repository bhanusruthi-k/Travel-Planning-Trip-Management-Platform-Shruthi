package com.tripnest.tripnest_backend.service;

import com.tripnest.tripnest_backend.dto.trip.TripRequestDTO;
import com.tripnest.tripnest_backend.dto.trip.TripResponseDTO;

import java.util.List;

public interface TripService {
    TripResponseDTO createTrip(TripRequestDTO dto, String userEmail);
    List<TripResponseDTO> getTripsForUser(String userEmail);
    TripResponseDTO getTripById(Long id, String userEmail);
    TripResponseDTO updateTrip(Long id, TripRequestDTO dto, String userEmail);
    void deleteTrip(Long id, String userEmail);
    List<TripResponseDTO> searchTrips(String query);
}
