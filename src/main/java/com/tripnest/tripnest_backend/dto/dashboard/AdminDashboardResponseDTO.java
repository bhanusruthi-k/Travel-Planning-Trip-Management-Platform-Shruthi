package com.tripnest.tripnest_backend.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardResponseDTO {
    private UserAnalyticsDTO userAnalytics;
    private TripAnalyticsDTO tripAnalytics;
    private List<DestinationAnalyticsDTO> destinationAnalytics;
    private PlatformStatsDTO platformStats;
}
