package com.tripnest.tripnest_backend.dto.destination;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DestinationResponseDTO {
    private Long id;
    private String name;
    private String country;
    private String description;
    private String imageUrl;
    private String category;
    private Double averageCost;
    private LocalDateTime createdAt;
}
