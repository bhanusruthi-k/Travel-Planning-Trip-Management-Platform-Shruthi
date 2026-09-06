package com.tripnest.tripnest_backend.dto.itinerary;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivityRequestDTO {

    private String time;

    @NotBlank(message = "Activity title is required")
    private String title;

    private String description;

    private String location;

    private Double cost;
}
