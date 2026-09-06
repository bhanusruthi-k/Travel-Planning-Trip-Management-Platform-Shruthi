package com.tripnest.tripnest_backend.dto.itinerary;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivityResponseDTO {
    private Long id;
    private String time;
    private String title;
    private String description;
    private String location;
    private Double cost;
    private Long itineraryDayId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
