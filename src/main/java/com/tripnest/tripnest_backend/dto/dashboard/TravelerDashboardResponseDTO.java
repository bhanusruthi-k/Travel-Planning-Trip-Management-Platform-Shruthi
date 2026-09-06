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
public class TravelerDashboardResponseDTO {
    private List<UpcomingTripDTO> upcomingTrips;
    private BudgetOverviewDTO budgetOverview;
    private List<ExpenseSummaryItemDTO> expenseSummary;
    private List<DestinationVisitDTO> favoriteDestinations;
    private TravelStatsDTO travelStats;
}
