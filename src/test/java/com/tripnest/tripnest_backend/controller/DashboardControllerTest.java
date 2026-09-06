package com.tripnest.tripnest_backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.tripnest.tripnest_backend.model.*;
import com.tripnest.tripnest_backend.repository.*;
import com.tripnest.tripnest_backend.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.tripnest.tripnest_backend.TripnestBackendApplication;

@SpringBootTest(classes = TripnestBackendApplication.class)
public class DashboardControllerTest {

    @Autowired
    private WebApplicationContext context;

    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DestinationRepository destinationRepository;

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private BudgetRepository budgetRepository;

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private User traveler;
    private User admin;
    private User groupAdmin;
    private Destination paris;
    private Destination tokyo;

    private String travelerToken;
    private String adminToken;
    private String groupAdminToken;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();

        expenseRepository.deleteAll();
        budgetRepository.deleteAll();
        tripRepository.deleteAll();

        String suffix = UUID.randomUUID().toString().substring(0, 8);
        traveler = userRepository.save(User.builder()
                .email("traveler_" + suffix + "@test.com")
                .password(passwordEncoder.encode("Password123!"))
                .fullName("John Traveler")
                .role(Role.TRAVELER)
                .build());

        admin = userRepository.save(User.builder()
                .email("admin_" + suffix + "@test.com")
                .password(passwordEncoder.encode("Password123!"))
                .fullName("Super Admin")
                .role(Role.ADMINISTRATOR)
                .build());

        groupAdmin = userRepository.save(User.builder()
                .email("groupAdmin_" + suffix + "@test.com")
                .password(passwordEncoder.encode("Password123!"))
                .fullName("Group Lead")
                .role(Role.GROUP_ADMIN)
                .build());

        travelerToken = "Bearer " + jwtTokenProvider.generateToken(traveler.getEmail(), traveler.getRole());
        adminToken = "Bearer " + jwtTokenProvider.generateToken(admin.getEmail(), admin.getRole());
        groupAdminToken = "Bearer " + jwtTokenProvider.generateToken(groupAdmin.getEmail(), groupAdmin.getRole());

        paris = destinationRepository.save(Destination.builder()
                .name("Paris " + suffix)
                .country("France")
                .description("City of Light")
                .category("CULTURE")
                .averageCost(3000.0)
                .build());

        tokyo = destinationRepository.save(Destination.builder()
                .name("Tokyo " + suffix)
                .country("Japan")
                .description("City of Future")
                .category("URBAN")
                .averageCost(4000.0)
                .build());
    }

    @Test
    @DisplayName("Traveler Dashboard returns aggregated data for authenticated user")
    void testTravelerDashboard_success() throws Exception {
        // Create 2 upcoming trips, 1 past trip
        Trip trip1 = tripRepository.save(Trip.builder()
                .title("Trip to Paris Soon")
                .user(traveler)
                .destination(paris)
                .startDate(LocalDate.now().plusDays(5))
                .endDate(LocalDate.now().plusDays(10))
                .status(TripStatus.PLANNED)
                .build());

        Trip trip2 = tripRepository.save(Trip.builder()
                .title("Trip to Tokyo Later")
                .user(traveler)
                .destination(tokyo)
                .startDate(LocalDate.now().plusDays(20))
                .endDate(LocalDate.now().plusDays(25))
                .status(TripStatus.PLANNED)
                .build());

        // Past trip
        Trip pastTrip = tripRepository.save(Trip.builder()
                .title("Past Paris Trip")
                .user(traveler)
                .destination(paris)
                .startDate(LocalDate.now().minusDays(30))
                .endDate(LocalDate.now().minusDays(20))
                .status(TripStatus.COMPLETED)
                .build());

        // Add budget & expenses
        Budget b1 = budgetRepository.save(Budget.builder()
                .trip(trip1)
                .totalBudget(new BigDecimal("50000.00"))
                .build());

        expenseRepository.save(Expense.builder()
                .trip(trip1)
                .budget(b1)
                .payer(traveler)
                .title("Hotel in Paris")
                .amount(new BigDecimal("20000.00"))
                .category(ExpenseCategory.HOTEL)
                .expenseDate(LocalDate.now())
                .build());

        expenseRepository.save(Expense.builder()
                .trip(trip1)
                .budget(b1)
                .payer(traveler)
                .title("Flight to Paris")
                .amount(new BigDecimal("15000.00"))
                .category(ExpenseCategory.TRANSPORTATION)
                .expenseDate(LocalDate.now())
                .build());

        mockMvc.perform(get("/api/dashboard/traveler")
                        .header("Authorization", travelerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.upcomingTrips", hasSize(2)))
                .andExpect(jsonPath("$.upcomingTrips[0].title", is("Trip to Paris Soon")))
                .andExpect(jsonPath("$.upcomingTrips[1].title", is("Trip to Tokyo Later")))
                .andExpect(jsonPath("$.budgetOverview.totalBudget", is(50000.0)))
                .andExpect(jsonPath("$.budgetOverview.totalSpent", is(35000.0)))
                .andExpect(jsonPath("$.budgetOverview.remainingBudget", is(15000.0)))
                .andExpect(jsonPath("$.expenseSummary", hasSize(2)))
                .andExpect(jsonPath("$.travelStats.totalTrips", is(3)))
                .andExpect(jsonPath("$.travelStats.totalDestinationsVisited", is(2)))
                .andExpect(jsonPath("$.travelStats.totalSpent", is(35000.0)))
                .andExpect(jsonPath("$.favoriteDestinations[0].destinationName", is(paris.getName())))
                .andExpect(jsonPath("$.favoriteDestinations[0].visitCount", is(2)));
    }

    @Test
    @DisplayName("Admin Dashboard accessible only to ADMINISTRATOR role")
    void testAdminDashboard_rbac() throws Exception {
        // Administrator -> 200 OK
        mockMvc.perform(get("/api/dashboard/admin")
                        .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userAnalytics.totalUsers", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.tripAnalytics.totalTrips", greaterThanOrEqualTo(0)))
                .andExpect(jsonPath("$.platformStats.totalExpenses", notNullValue()));

        // Traveler -> 403 Forbidden
        mockMvc.perform(get("/api/dashboard/admin")
                        .header("Authorization", travelerToken))
                .andExpect(status().isForbidden());

        // Group Admin -> 403 Forbidden
        mockMvc.perform(get("/api/dashboard/admin")
                        .header("Authorization", groupAdminToken))
                .andExpect(status().isForbidden());

        // Unauthenticated -> 4xx (Forbidden / Unauthorized)
        mockMvc.perform(get("/api/dashboard/admin"))
                .andExpect(status().is4xxClientError());
    }
}
