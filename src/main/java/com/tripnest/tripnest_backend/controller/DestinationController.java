package com.tripnest.tripnest_backend.controller;

import com.tripnest.tripnest_backend.dto.destination.DestinationRequestDTO;
import com.tripnest.tripnest_backend.dto.destination.DestinationResponseDTO;
import com.tripnest.tripnest_backend.dto.destination.PlaceDTO;
import com.tripnest.tripnest_backend.dto.destination.WeatherResponseDTO;
import com.tripnest.tripnest_backend.service.DestinationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/destinations")
@RequiredArgsConstructor
public class DestinationController {

    private final DestinationService destinationService;

    @GetMapping
    public ResponseEntity<List<DestinationResponseDTO>> getAllDestinations(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Boolean popular,
            @RequestParam(required = false) String search) {
        List<DestinationResponseDTO> destinations = destinationService.getAllDestinations(category, popular, search);
        return ResponseEntity.ok(destinations);
    }

    @GetMapping("/search")
    public ResponseEntity<List<DestinationResponseDTO>> searchDestinations(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String search) {
        String searchTerm = name != null ? name : (query != null ? query : search);
        List<DestinationResponseDTO> destinations = destinationService.getAllDestinations(null, null, searchTerm);
        return ResponseEntity.ok(destinations);
    }

    @GetMapping("/popular")
    public ResponseEntity<List<DestinationResponseDTO>> getPopularDestinations() {
        List<DestinationResponseDTO> popular = destinationService.getPopularDestinations();
        return ResponseEntity.ok(popular);
    }

    @GetMapping("/{id}")
    public ResponseEntity<DestinationResponseDTO> getDestinationById(@PathVariable Long id) {
        DestinationResponseDTO destination = destinationService.getDestinationById(id);
        return ResponseEntity.ok(destination);
    }

    @GetMapping("/{id}/weather")
    public ResponseEntity<WeatherResponseDTO> getDestinationWeather(@PathVariable Long id) {
        WeatherResponseDTO weather = destinationService.getDestinationWeather(id);
        return ResponseEntity.ok(weather);
    }

    @GetMapping("/{id}/places")
    public ResponseEntity<List<PlaceDTO>> getDestinationPlaces(@PathVariable Long id) {
        List<PlaceDTO> places = destinationService.getDestinationPlaces(id);
        return ResponseEntity.ok(places);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMINISTRATOR', 'GROUP_ADMIN')")
    public ResponseEntity<DestinationResponseDTO> createDestination(@Valid @RequestBody DestinationRequestDTO dto) {
        DestinationResponseDTO created = destinationService.createDestination(dto);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMINISTRATOR', 'GROUP_ADMIN')")
    public ResponseEntity<DestinationResponseDTO> updateDestination(
            @PathVariable Long id,
            @Valid @RequestBody DestinationRequestDTO dto) {
        DestinationResponseDTO updated = destinationService.updateDestination(id, dto);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMINISTRATOR', 'GROUP_ADMIN')")
    public ResponseEntity<Void> deleteDestination(@PathVariable Long id) {
        destinationService.deleteDestination(id);
        return ResponseEntity.noContent().build();
    }
}

