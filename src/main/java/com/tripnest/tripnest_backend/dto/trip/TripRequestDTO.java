package com.tripnest.tripnest_backend.dto.trip;

import com.tripnest.tripnest_backend.model.TripStatus;
import jakarta.validation.constraints.NotBlank;
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
public class TripRequestDTO {

    @NotBlank(message = "Trip title is required")
    private String title;

    private String description;

    @NotNull(message = "Destination ID is required")
    private Long destinationId;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    private LocalDate endDate;

    private Double budget;

    private TripStatus status;

    private java.util.List<String> invitedEmails;
}
