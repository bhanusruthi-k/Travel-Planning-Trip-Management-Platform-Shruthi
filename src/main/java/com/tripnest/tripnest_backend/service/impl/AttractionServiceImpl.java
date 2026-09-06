package com.tripnest.tripnest_backend.service.impl;

import com.tripnest.tripnest_backend.dto.destination.AttractionRequestDTO;
import com.tripnest.tripnest_backend.dto.destination.AttractionResponseDTO;
import com.tripnest.tripnest_backend.exception.ResourceNotFoundException;
import com.tripnest.tripnest_backend.model.Attraction;
import com.tripnest.tripnest_backend.model.Destination;
import com.tripnest.tripnest_backend.repository.AttractionRepository;
import com.tripnest.tripnest_backend.repository.DestinationRepository;
import com.tripnest.tripnest_backend.service.AttractionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AttractionServiceImpl implements AttractionService {

    private final AttractionRepository attractionRepository;
    private final DestinationRepository destinationRepository;

    @Override
    @Transactional(readOnly = true)
    public List<AttractionResponseDTO> getAttractionsByDestinationId(Long destinationId) {
        if (!destinationRepository.existsById(destinationId)) {
            throw new ResourceNotFoundException("Destination not found with id: " + destinationId);
        }

        List<Attraction> attractions = attractionRepository.findByDestinationIdOrderByIdAsc(destinationId);
        return attractions.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public AttractionResponseDTO createAttraction(Long destinationId, AttractionRequestDTO dto) {
        Destination destination = destinationRepository.findById(destinationId)
                .orElseThrow(() -> new ResourceNotFoundException("Destination not found with id: " + destinationId));

        Attraction attraction = Attraction.builder()
                .destination(destination)
                .name(dto.getName().trim())
                .description(dto.getDescription() != null ? dto.getDescription().trim() : null)
                .build();

        Attraction saved = attractionRepository.save(attraction);
        return mapToDTO(saved);
    }

    private AttractionResponseDTO mapToDTO(Attraction attraction) {
        if (attraction == null) return null;
        return AttractionResponseDTO.builder()
                .id(attraction.getId())
                .destinationId(attraction.getDestination() != null ? attraction.getDestination().getId() : null)
                .name(attraction.getName())
                .description(attraction.getDescription())
                .createdAt(attraction.getCreatedAt())
                .updatedAt(attraction.getUpdatedAt())
                .build();
    }
}
