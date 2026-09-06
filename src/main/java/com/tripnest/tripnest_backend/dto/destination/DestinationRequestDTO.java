package com.tripnest.tripnest_backend.dto.destination;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DestinationRequestDTO {

    @NotBlank(message = "Destination name is required")
    private String name;

    @NotBlank(message = "Country is required")
    private String country;

    private String description;

    private String imageUrl;

    private String category;

    private Double averageCost;
}
