package com.tripnest.tripnest_backend.service;

import com.tripnest.tripnest_backend.dto.destination.DestinationRequestDTO;
import com.tripnest.tripnest_backend.dto.destination.DestinationResponseDTO;
import com.tripnest.tripnest_backend.dto.destination.PlaceDTO;
import com.tripnest.tripnest_backend.dto.destination.WeatherResponseDTO;

import java.util.List;

public interface DestinationService {
    List<DestinationResponseDTO> getAllDestinations(String category, Boolean popular, String search);
    DestinationResponseDTO getDestinationById(Long id);
    DestinationResponseDTO createDestination(DestinationRequestDTO dto);
    DestinationResponseDTO updateDestination(Long id, DestinationRequestDTO dto);
    void deleteDestination(Long id);
    WeatherResponseDTO getDestinationWeather(Long id);
    List<PlaceDTO> getDestinationPlaces(Long id);
    List<DestinationResponseDTO> getPopularDestinations();
}

