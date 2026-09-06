package com.tripnest.tripnest_backend.service;

import com.tripnest.tripnest_backend.dto.destination.AttractionRequestDTO;
import com.tripnest.tripnest_backend.dto.destination.AttractionResponseDTO;

import java.util.List;

public interface AttractionService {

    List<AttractionResponseDTO> getAttractionsByDestinationId(Long destinationId);

    AttractionResponseDTO createAttraction(Long destinationId, AttractionRequestDTO dto);
}
