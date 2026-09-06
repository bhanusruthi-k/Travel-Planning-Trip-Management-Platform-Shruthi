package com.tripnest.tripnest_backend.dto.dashboard;

import com.tripnest.tripnest_backend.model.TripStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpcomingTripDTO {
    private Long id;
    private String title;
    private Long destinationId;
    private String destinationName;
    private String destinationCountry;
    private String destinationImageUrl;
    private LocalDate startDate;
    private LocalDate endDate;
    private TripStatus status;
    private BigDecimal budgetTotal;
}
