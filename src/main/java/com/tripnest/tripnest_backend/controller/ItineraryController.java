package com.tripnest.tripnest_backend.controller;

import com.tripnest.tripnest_backend.dto.itinerary.ActivityRequestDTO;
import com.tripnest.tripnest_backend.dto.itinerary.ActivityResponseDTO;
import com.tripnest.tripnest_backend.dto.itinerary.ItineraryDayRequestDTO;
import com.tripnest.tripnest_backend.dto.itinerary.ItineraryDayResponseDTO;
import com.tripnest.tripnest_backend.service.ItineraryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/trips")
@RequiredArgsConstructor
public class ItineraryController {

    private final ItineraryService itineraryService;

    @PostMapping("/{tripId}/itinerary-days")
    public ResponseEntity<ItineraryDayResponseDTO> addDay(@PathVariable Long tripId,
                                                          @Valid @RequestBody ItineraryDayRequestDTO dto,
                                                          Authentication authentication) {
        ItineraryDayResponseDTO created = itineraryService.addDay(tripId, dto, authentication.getName());
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @GetMapping("/{tripId}/itinerary-days")
    public ResponseEntity<List<ItineraryDayResponseDTO>> getItineraryForTrip(@PathVariable Long tripId,
                                                                             Authentication authentication) {
        List<ItineraryDayResponseDTO> days = itineraryService.getItineraryForTrip(tripId, authentication.getName());
        return ResponseEntity.ok(days);
    }

    @DeleteMapping("/{tripId}/itinerary-days/{dayId}")
    public ResponseEntity<Void> deleteDay(@PathVariable Long tripId,
                                          @PathVariable Long dayId,
                                          Authentication authentication) {
        itineraryService.deleteDay(tripId, dayId, authentication.getName());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/itinerary-days/{dayId}/activities")
    public ResponseEntity<ActivityResponseDTO> addActivity(@PathVariable Long dayId,
                                                           @Valid @RequestBody ActivityRequestDTO dto,
                                                           Authentication authentication) {
        ActivityResponseDTO created = itineraryService.addActivity(dayId, dto, authentication.getName());
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PutMapping("/activities/{activityId}")
    public ResponseEntity<ActivityResponseDTO> updateActivity(@PathVariable Long activityId,
                                                              @Valid @RequestBody ActivityRequestDTO dto,
                                                              Authentication authentication) {
        ActivityResponseDTO updated = itineraryService.updateActivity(activityId, dto, authentication.getName());
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/activities/{activityId}")
    public ResponseEntity<Void> deleteActivity(@PathVariable Long activityId,
                                               Authentication authentication) {
        itineraryService.deleteActivity(activityId, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
