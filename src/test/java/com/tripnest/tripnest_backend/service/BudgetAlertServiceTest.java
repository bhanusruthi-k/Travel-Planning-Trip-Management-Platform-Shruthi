package com.tripnest.tripnest_backend.service;

import com.tripnest.tripnest_backend.TripnestBackendApplication;
import com.tripnest.tripnest_backend.dto.expense.ExpenseRequestDTO;
import com.tripnest.tripnest_backend.dto.expense.ExpenseResponseDTO;
import com.tripnest.tripnest_backend.model.*;
import com.tripnest.tripnest_backend.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(classes = TripnestBackendApplication.class)
@Transactional
public class BudgetAlertServiceTest {

    @Autowired
    private ExpenseService expenseService;

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private DestinationRepository destinationRepository;

    @Autowired
    private BudgetRepository budgetRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TripMembershipRepository tripMembershipRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    private User owner;
    private User member;
    private Trip trip;
    private Budget budget;

    @BeforeEach
    void setUp() {
        owner = userRepository.save(User.builder()
                .email("owner_budget@tripnest.com")
                .fullName("Owner Budget")
                .password("Password123!")
                .role(Role.TRAVELER)
                .build());

        member = userRepository.save(User.builder()
                .email("member_budget@tripnest.com")
                .fullName("Member Budget")
                .password("Password123!")
                .role(Role.TRAVELER)
                .build());

        Destination destination = destinationRepository.save(Destination.builder()
                .name("Tokyo")
                .country("Japan")
                .description("Futuristic and traditional")
                .category("CULTURE")
                .averageCost(150.0)
                .build());

        trip = tripRepository.save(Trip.builder()
                .title("Tokyo Adventure")
                .startDate(LocalDate.now().plusDays(10))
                .endDate(LocalDate.now().plusDays(17))
                .destination(destination)
                .user(owner)
                .status(TripStatus.PLANNED)
                .build());

        tripMembershipRepository.save(TripMembership.builder()
                .trip(trip)
                .user(member)
                .memberRole(MemberRole.MEMBER)
                .build());

        // Budget: ₹50,000
        budget = budgetRepository.save(Budget.builder()
                .trip(trip)
                .totalBudget(new BigDecimal("50000.00"))
                .currency("INR")
                .build());
    }

    @Test
    @DisplayName("Crossing 80% threshold generates budget alert for owner and member")
    void testEightyPercentThresholdAlert() {
        // Expense 1: ₹40,000 (80% of 50,000)
        ExpenseRequestDTO exp1 = ExpenseRequestDTO.builder()
                .title("Flight Tickets")
                .category("Transportation")
                .amount(new BigDecimal("40000.00"))
                .expenseDate(LocalDate.now())
                .build();

        expenseService.createExpense(trip.getId(), exp1, owner.getEmail());

        List<Notification> ownerNotifs = notificationRepository.findByUserIdOrderByCreatedAtDesc(owner.getId());
        assertEquals(1, ownerNotifs.size());
        assertTrue(ownerNotifs.get(0).getMessage().contains("80%"));
        assertEquals(NotificationType.BUDGET_ALERT, ownerNotifs.get(0).getNotifType());

        List<Notification> memberNotifs = notificationRepository.findByUserIdOrderByCreatedAtDesc(member.getId());
        assertEquals(1, memberNotifs.size());
        assertTrue(memberNotifs.get(0).getMessage().contains("80%"));
    }

    @Test
    @DisplayName("Increasing spending while already above 80% does not send duplicate 80% alert")
    void testNoDuplicateEightyPercentAlert() {
        // Expense 1: ₹40,000 (80%) -> sends 80% alert
        expenseService.createExpense(trip.getId(), ExpenseRequestDTO.builder()
                .title("Flight Tickets")
                .category("Transportation")
                .amount(new BigDecimal("40000.00"))
                .expenseDate(LocalDate.now())
                .build(), owner.getEmail());

        // Expense 2: ₹2,000 (Total = ₹42,000, 84%) -> should NOT send another 80% alert
        expenseService.createExpense(trip.getId(), ExpenseRequestDTO.builder()
                .title("Airport Taxi")
                .category("Transportation")
                .amount(new BigDecimal("2000.00"))
                .expenseDate(LocalDate.now())
                .build(), owner.getEmail());

        List<Notification> ownerNotifs = notificationRepository.findByUserIdOrderByCreatedAtDesc(owner.getId());
        assertEquals(1, ownerNotifs.size(), "Owner should still have only 1 notification for 80%");
    }

    @Test
    @DisplayName("Reaching 100% threshold sends 100% alert")
    void testHundredPercentThresholdAlert() {
        // Expense 1: ₹40,000 (80%) -> sends 80% alert
        expenseService.createExpense(trip.getId(), ExpenseRequestDTO.builder()
                .title("Flight Tickets")
                .category("Transportation")
                .amount(new BigDecimal("40000.00"))
                .expenseDate(LocalDate.now())
                .build(), owner.getEmail());

        // Expense 2: ₹10,000 (Total = ₹50,000, 100%) -> sends 100% alert
        expenseService.createExpense(trip.getId(), ExpenseRequestDTO.builder()
                .title("Hotel Booking")
                .category("Hotel")
                .amount(new BigDecimal("10000.00"))
                .expenseDate(LocalDate.now())
                .build(), owner.getEmail());

        List<Notification> ownerNotifs = notificationRepository.findByUserIdOrderByCreatedAtDesc(owner.getId());
        assertEquals(2, ownerNotifs.size(), "Owner should have 2 notifications (80% and 100%)");
        assertTrue(ownerNotifs.get(0).getMessage().contains("100%"));
    }

    @Test
    @DisplayName("Editing expense down below 80% and back above triggers alert again properly")
    void testExpenseUpdateResetAndReAlert() {
        // Expense: ₹40,000 (80%) -> sends 80% alert
        ExpenseResponseDTO created = expenseService.createExpense(trip.getId(), ExpenseRequestDTO.builder()
                .title("Hotel")
                .category("Hotel")
                .amount(new BigDecimal("40000.00"))
                .expenseDate(LocalDate.now())
                .build(), owner.getEmail());

        assertEquals(1, notificationRepository.findByUserIdOrderByCreatedAtDesc(owner.getId()).size());

        // Update expense down to ₹35,000 (70% < 80%)
        expenseService.updateExpense(trip.getId(), created.getId(), ExpenseRequestDTO.builder()
                .title("Hotel Discounted")
                .category("Hotel")
                .amount(new BigDecimal("35000.00"))
                .expenseDate(LocalDate.now())
                .build(), owner.getEmail());

        // Add another expense of ₹6,000 (Total = ₹41,000, 82% >= 80%) -> triggers 80% alert again
        expenseService.createExpense(trip.getId(), ExpenseRequestDTO.builder()
                .title("Dinner")
                .category("Food")
                .amount(new BigDecimal("6000.00"))
                .expenseDate(LocalDate.now())
                .build(), owner.getEmail());

        List<Notification> ownerNotifs = notificationRepository.findByUserIdOrderByCreatedAtDesc(owner.getId());
        assertEquals(2, ownerNotifs.size(), "Owner should receive a new 80% alert after crossing again");
    }
}
