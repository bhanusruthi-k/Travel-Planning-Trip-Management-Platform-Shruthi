package com.tripnest.tripnest_backend.controller;

import com.tripnest.tripnest_backend.dto.trip.TripRequestDTO;
import com.tripnest.tripnest_backend.dto.trip.TripResponseDTO;
import com.tripnest.tripnest_backend.service.TripService;
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
public class TripController {

    private final TripService tripService;

    @PostMapping
    public ResponseEntity<TripResponseDTO> createTrip(@Valid @RequestBody TripRequestDTO dto,
                                                      Authentication authentication) {
        String userEmail = authentication.getName();
        TripResponseDTO createdTrip = tripService.createTrip(dto, userEmail);
        return new ResponseEntity<>(createdTrip, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<TripResponseDTO>> getTrips(Authentication authentication) {
        String userEmail = authentication.getName();
        List<TripResponseDTO> trips = tripService.getTripsForUser(userEmail);
        return ResponseEntity.ok(trips);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TripResponseDTO> getTripById(@PathVariable Long id,
                                                       Authentication authentication) {
        String userEmail = authentication.getName();
        TripResponseDTO trip = tripService.getTripById(id, userEmail);
        return ResponseEntity.ok(trip);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TripResponseDTO> updateTrip(@PathVariable Long id,
                                                      @Valid @RequestBody TripRequestDTO dto,
                                                      Authentication authentication) {
        String userEmail = authentication.getName();
        TripResponseDTO updatedTrip = tripService.updateTrip(id, dto, userEmail);
        return ResponseEntity.ok(updatedTrip);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTrip(@PathVariable Long id,
                                           Authentication authentication) {
        String userEmail = authentication.getName();
        tripService.deleteTrip(id, userEmail);
        return ResponseEntity.noContent().build();
    }
}
