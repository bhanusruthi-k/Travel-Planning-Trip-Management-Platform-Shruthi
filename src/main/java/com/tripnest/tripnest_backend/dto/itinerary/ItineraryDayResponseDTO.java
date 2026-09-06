package com.tripnest.tripnest_backend.dto.itinerary;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ItineraryDayResponseDTO {
    private Long id;
    private Integer dayNumber;
    private LocalDate date;
    private String title;
    private Long tripId;
    @Builder.Default
    private List<ActivityResponseDTO> activities = new ArrayList<>();
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
