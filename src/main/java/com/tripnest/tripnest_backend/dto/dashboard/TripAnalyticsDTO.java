package com.tripnest.tripnest_backend.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TripAnalyticsDTO {
    private long totalTrips;
    private long activeTrips;
    private long completedTrips;
    private long plannedTrips;
    private long cancelledTrips;
}
