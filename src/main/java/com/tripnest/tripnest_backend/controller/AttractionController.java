package com.tripnest.tripnest_backend.controller;

import com.tripnest.tripnest_backend.dto.destination.AttractionRequestDTO;
import com.tripnest.tripnest_backend.dto.destination.AttractionResponseDTO;
import com.tripnest.tripnest_backend.service.AttractionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/destinations/{destinationId}/attractions")
@RequiredArgsConstructor
public class AttractionController {

    private final AttractionService attractionService;

    @GetMapping
    public ResponseEntity<List<AttractionResponseDTO>> getAttractionsByDestination(@PathVariable Long destinationId) {
        List<AttractionResponseDTO> attractions = attractionService.getAttractionsByDestinationId(destinationId);
        return ResponseEntity.ok(attractions);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<AttractionResponseDTO> createAttraction(
            @PathVariable Long destinationId,
            @Valid @RequestBody AttractionRequestDTO dto) {
        AttractionResponseDTO created = attractionService.createAttraction(destinationId, dto);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }
}
