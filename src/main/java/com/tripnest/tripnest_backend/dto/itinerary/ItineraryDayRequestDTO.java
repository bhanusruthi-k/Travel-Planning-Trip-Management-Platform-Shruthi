package com.tripnest.tripnest_backend.dto.itinerary;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ItineraryDayRequestDTO {

    @NotNull(message = "Day number is required")
    private Integer dayNumber;

    private LocalDate date;

    private String title;
}
