package com.tripnest.tripnest_backend.service.impl;

import com.tripnest.tripnest_backend.dto.dashboard.*;
import com.tripnest.tripnest_backend.dto.expense.CategoryExpenseSummaryDTO;
import com.tripnest.tripnest_backend.exception.ResourceNotFoundException;
import com.tripnest.tripnest_backend.model.*;
import com.tripnest.tripnest_backend.repository.*;
import com.tripnest.tripnest_backend.service.DashboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DashboardServiceImpl implements DashboardService {

    private final UserRepository userRepository;
    private final TripRepository tripRepository;
    private final BudgetRepository budgetRepository;
    private final ExpenseRepository expenseRepository;
    private final NotificationRepository notificationRepository;
    private final DestinationRepository destinationRepository;

    @Override
    @Transactional(readOnly = true)
    public TravelerDashboardResponseDTO getTravelerDashboard(String userEmail) {
        User user = getUser(userEmail);
        Long userId = user.getId();
        LocalDate today = LocalDate.now();

        // 1. Upcoming Trips (Start date >= today, sorted soonest first)
        List<Trip> trips = tripRepository.findUpcomingTripsByUserId(userId, today);
        List<UpcomingTripDTO> upcomingTrips = trips.stream()
                .map(t -> {
                    BigDecimal budgetAmt = BigDecimal.ZERO;
                    if (t.getBudget() != null) {
                        budgetAmt = BigDecimal.valueOf(t.getBudget());
                    }
                    return UpcomingTripDTO.builder()
                            .id(t.getId())
                            .title(t.getTitle())
                            .destinationId(t.getDestination() != null ? t.getDestination().getId() : null)
                            .destinationName(t.getDestination() != null ? t.getDestination().getName() : "Unassigned")
                            .destinationCountry(t.getDestination() != null ? t.getDestination().getCountry() : "")
                            .destinationImageUrl(t.getDestination() != null ? t.getDestination().getImageUrl() : null)
                            .startDate(t.getStartDate())
                            .endDate(t.getEndDate())
                            .status(t.getStatus())
                            .budgetTotal(budgetAmt)
                            .build();
                })
                .collect(Collectors.toList());

        // 2. Budget Overview (across user's trips)
        BigDecimal totalBudget = budgetRepository.getTotalBudgetByUserId(userId);
        if (totalBudget == null || totalBudget.compareTo(BigDecimal.ZERO) == 0) {
            // Also check trip.budget legacy if budget table doesn't have it
            double sumTripBudget = trips.stream()
                    .filter(t -> t.getBudget() != null)
                    .mapToDouble(Trip::getBudget)
                    .sum();
            if (sumTripBudget > 0) {
                totalBudget = BigDecimal.valueOf(sumTripBudget);
            } else {
                totalBudget = BigDecimal.ZERO;
            }
        }

        BigDecimal totalSpent = expenseRepository.getTotalSpentByUserId(userId);
        if (totalSpent == null) totalSpent = BigDecimal.ZERO;

        BigDecimal remainingBudget = totalBudget.subtract(totalSpent);

        BudgetOverviewDTO budgetOverview = BudgetOverviewDTO.builder()
                .totalBudget(totalBudget)
                .totalSpent(totalSpent)
                .remainingBudget(remainingBudget)
                .build();

        // 3. Expense Summary (by category across user's trips)
        List<CategoryExpenseSummaryDTO> categorySummaries = expenseRepository.getCategorySummaryByUserId(userId);
        final BigDecimal finalTotalSpent = totalSpent;
        List<ExpenseSummaryItemDTO> expenseSummary = categorySummaries.stream()
                .map(cs -> {
                    BigDecimal amt = cs.getTotalAmount() != null ? cs.getTotalAmount() : BigDecimal.ZERO;
                    double pct = 0.0;
                    if (finalTotalSpent.compareTo(BigDecimal.ZERO) > 0) {
                        pct = amt.divide(finalTotalSpent, 4, RoundingMode.HALF_UP).doubleValue() * 100;
                    }
                    return ExpenseSummaryItemDTO.builder()
                            .category(cs.getCategory())
                            .amount(amt)
                            .count(cs.getCount() != null ? cs.getCount() : 0L)
                            .percentage(Math.round(pct * 10.0) / 10.0)
                            .build();
                })
                .collect(Collectors.toList());

        // 4. Favorite / Most-Visited Destinations (derived from trip history)
        List<DestinationVisitDTO> mostVisited = tripRepository.getMostVisitedDestinationsByUserId(userId);
        // Enrich image URLs if needed
        Map<Long, String> destImageMap = destinationRepository.findAll().stream()
                .filter(d -> d.getImageUrl() != null)
                .collect(Collectors.toMap(Destination::getId, Destination::getImageUrl, (a, b) -> a));

        for (DestinationVisitDTO dv : mostVisited) {
            if (dv.getDestinationId() != null && destImageMap.containsKey(dv.getDestinationId())) {
                dv.setImageUrl(destImageMap.get(dv.getDestinationId()));
            }
        }

        // 5. Travel Stats
        long totalTrips = tripRepository.countByUserId(userId);
        long totalDestinationsVisited = tripRepository.countDistinctDestinationsByUserId(userId);

        TravelStatsDTO travelStats = TravelStatsDTO.builder()
                .totalTrips(totalTrips)
                .totalDestinationsVisited(totalDestinationsVisited)
                .totalSpent(totalSpent)
                .build();

        return TravelerDashboardResponseDTO.builder()
                .upcomingTrips(upcomingTrips)
                .budgetOverview(budgetOverview)
                .expenseSummary(expenseSummary)
                .favoriteDestinations(mostVisited)
                .travelStats(travelStats)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public AdminDashboardResponseDTO getAdminDashboard() {
        // 1. User Analytics
        long totalUsers = userRepository.count();
        UserAnalyticsDTO userAnalytics = UserAnalyticsDTO.builder()
                .totalUsers(totalUsers)
                .build();

        // 2. Trip Analytics
        long totalTrips = tripRepository.count();
        long activeTrips = tripRepository.countByStatus(TripStatus.ONGOING);
        long completedTrips = tripRepository.countByStatus(TripStatus.COMPLETED);
        long plannedTrips = tripRepository.countByStatus(TripStatus.PLANNED);
        long cancelledTrips = tripRepository.countByStatus(TripStatus.CANCELLED);

        TripAnalyticsDTO tripAnalytics = TripAnalyticsDTO.builder()
                .totalTrips(totalTrips)
                .activeTrips(activeTrips)
                .completedTrips(completedTrips)
                .plannedTrips(plannedTrips)
                .cancelledTrips(cancelledTrips)
                .build();

        // 3. Destination Analytics
        List<DestinationAnalyticsDTO> destinationAnalytics = tripRepository.getPopularDestinationsAcrossPlatform();
        Map<Long, String> destImageMap = destinationRepository.findAll().stream()
                .filter(d -> d.getImageUrl() != null)
                .collect(Collectors.toMap(Destination::getId, Destination::getImageUrl, (a, b) -> a));

        for (DestinationAnalyticsDTO da : destinationAnalytics) {
            if (da.getDestinationId() != null && destImageMap.containsKey(da.getDestinationId())) {
                da.setImageUrl(destImageMap.get(da.getDestinationId()));
            }
        }

        // 4. Platform Stats
        BigDecimal totalExpenses = expenseRepository.getTotalPlatformExpenses();
        if (totalExpenses == null) totalExpenses = BigDecimal.ZERO;

        long totalNotifications = notificationRepository.count();

        PlatformStatsDTO platformStats = PlatformStatsDTO.builder()
                .totalExpenses(totalExpenses)
                .totalNotifications(totalNotifications)
                .build();

        return AdminDashboardResponseDTO.builder()
                .userAnalytics(userAnalytics)
                .tripAnalytics(tripAnalytics)
                .destinationAnalytics(destinationAnalytics)
                .platformStats(platformStats)
                .build();
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }
}
