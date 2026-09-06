package com.tripnest.tripnest_backend.dto.trip;

import com.tripnest.tripnest_backend.dto.auth.UserDTO;
import com.tripnest.tripnest_backend.dto.destination.DestinationResponseDTO;
import com.tripnest.tripnest_backend.model.TripStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TripResponseDTO {
    private Long id;
    private String title;
    private String description;
    private LocalDate startDate;
    private LocalDate endDate;
    private Double budget;
    private TripStatus status;
    private DestinationResponseDTO destination;
    private UserDTO user;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
