package com.tripnest.tripnest_backend.service.impl;

import com.tripnest.tripnest_backend.dto.expense.BudgetExpenseSummaryDTO;
import com.tripnest.tripnest_backend.dto.expense.CategoryExpenseSummaryDTO;
import com.tripnest.tripnest_backend.dto.expense.ExpenseRequestDTO;
import com.tripnest.tripnest_backend.dto.expense.ExpenseResponseDTO;
import com.tripnest.tripnest_backend.exception.BadRequestException;
import com.tripnest.tripnest_backend.exception.ResourceNotFoundException;
import com.tripnest.tripnest_backend.model.*;
import com.tripnest.tripnest_backend.repository.*;
import com.tripnest.tripnest_backend.service.ExpenseService;
import com.tripnest.tripnest_backend.service.NotificationService;
import com.tripnest.tripnest_backend.service.TripAccessService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExpenseServiceImpl implements ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final TripRepository tripRepository;
    private final BudgetRepository budgetRepository;
    private final UserRepository userRepository;
    private final TripMembershipRepository tripMembershipRepository;
    private final TripAccessService tripAccessService;
    private final NotificationService notificationService;
    private final ReminderLogRepository reminderLogRepository;

    @Override
    @Transactional
    public ExpenseResponseDTO createExpense(Long tripId, ExpenseRequestDTO dto, String userEmail) {
        User currentUser = getUser(userEmail);
        Trip trip = getTrip(tripId);
        tripAccessService.validateTripAccess(currentUser, trip);

        User payer = currentUser;
        if (dto.getPayerId() != null && !dto.getPayerId().equals(currentUser.getId())) {
            payer = userRepository.findById(dto.getPayerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Payer not found with id: " + dto.getPayerId()));
        }

        validateExpenseAmount(dto.getAmount());
        ExpenseCategory category = parseCategory(dto.getCategory());

        Optional<Budget> budgetOpt = budgetRepository.findByTripId(tripId);

        Expense expense = Expense.builder()
                .title(dto.getTitle().trim())
                .description(dto.getDescription())
                .category(category)
                .amount(dto.getAmount())
                .expenseDate(dto.getExpenseDate())
                .receiptUrl(dto.getReceiptUrl())
                .trip(trip)
                .budget(budgetOpt.orElse(null))
                .payer(payer)
                .build();

        BigDecimal previousSpent = expenseRepository.getTotalSpentByTripId(tripId);
        if (previousSpent == null) previousSpent = BigDecimal.ZERO;

        Expense saved = expenseRepository.save(expense);

        BigDecimal newSpent = expenseRepository.getTotalSpentByTripId(tripId);
        if (newSpent == null) newSpent = BigDecimal.ZERO;

        checkAndNotifyBudgetThresholds(trip, previousSpent, newSpent);

        return mapToDTO(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExpenseResponseDTO> getExpensesByTripId(Long tripId, String userEmail) {
        User currentUser = getUser(userEmail);
        Trip trip = getTrip(tripId);
        tripAccessService.validateTripAccess(currentUser, trip);

        List<Expense> expenses = expenseRepository.findByTripIdOrderByExpenseDateDesc(tripId);
        return expenses.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ExpenseResponseDTO getExpenseById(Long tripId, Long expenseId, String userEmail) {
        User currentUser = getUser(userEmail);
        Trip trip = getTrip(tripId);
        tripAccessService.validateTripAccess(currentUser, trip);

        Expense expense = expenseRepository.findByIdAndTripId(expenseId, tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found with id: " + expenseId + " for trip id: " + tripId));

        return mapToDTO(expense);
    }

    @Override
    @Transactional
    public ExpenseResponseDTO updateExpense(Long tripId, Long expenseId, ExpenseRequestDTO dto, String userEmail) {
        User currentUser = getUser(userEmail);
        Trip trip = getTrip(tripId);
        tripAccessService.validateTripAccess(currentUser, trip);

        Expense expense = expenseRepository.findByIdAndTripId(expenseId, tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found with id: " + expenseId + " for trip id: " + tripId));

        validateExpenseAmount(dto.getAmount());
        ExpenseCategory category = parseCategory(dto.getCategory());

        if (dto.getPayerId() != null && !dto.getPayerId().equals(expense.getPayer().getId())) {
            User payer = userRepository.findById(dto.getPayerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Payer not found with id: " + dto.getPayerId()));
            expense.setPayer(payer);
        }

        expense.setTitle(dto.getTitle().trim());
        expense.setDescription(dto.getDescription());
        expense.setCategory(category);
        expense.setAmount(dto.getAmount());
        expense.setExpenseDate(dto.getExpenseDate());
        expense.setReceiptUrl(dto.getReceiptUrl());

        if (expense.getBudget() == null) {
            budgetRepository.findByTripId(tripId).ifPresent(expense::setBudget);
        }

        BigDecimal previousSpent = expenseRepository.getTotalSpentByTripId(tripId);
        if (previousSpent == null) previousSpent = BigDecimal.ZERO;

        Expense updated = expenseRepository.save(expense);

        BigDecimal newSpent = expenseRepository.getTotalSpentByTripId(tripId);
        if (newSpent == null) newSpent = BigDecimal.ZERO;

        checkAndNotifyBudgetThresholds(trip, previousSpent, newSpent);

        return mapToDTO(updated);
    }

    @Override
    @Transactional
    public void deleteExpense(Long tripId, Long expenseId, String userEmail) {
        User currentUser = getUser(userEmail);
        Trip trip = getTrip(tripId);
        tripAccessService.validateTripAccess(currentUser, trip);

        Expense expense = expenseRepository.findByIdAndTripId(expenseId, tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found with id: " + expenseId + " for trip id: " + tripId));

        BigDecimal previousSpent = expenseRepository.getTotalSpentByTripId(tripId);
        if (previousSpent == null) previousSpent = BigDecimal.ZERO;

        expenseRepository.delete(expense);

        BigDecimal newSpent = expenseRepository.getTotalSpentByTripId(tripId);
        if (newSpent == null) newSpent = BigDecimal.ZERO;

        checkAndNotifyBudgetThresholds(trip, previousSpent, newSpent);
    }

    private void checkAndNotifyBudgetThresholds(Trip trip, BigDecimal previousSpent, BigDecimal newSpent) {
        Long tripId = trip.getId();
        Optional<Budget> budgetOpt = budgetRepository.findByTripId(tripId);

        BigDecimal totalBudget = BigDecimal.ZERO;
        if (budgetOpt.isPresent() && budgetOpt.get().getTotalBudget() != null) {
            totalBudget = budgetOpt.get().getTotalBudget();
        } else if (trip.getBudget() != null && trip.getBudget() > 0) {
            totalBudget = BigDecimal.valueOf(trip.getBudget());
        }

        if (totalBudget.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }

        BigDecimal hundred = BigDecimal.valueOf(100);
        BigDecimal eighty = BigDecimal.valueOf(80);

        BigDecimal prevPercentage = previousSpent.multiply(hundred).divide(totalBudget, 2, RoundingMode.HALF_UP);
        BigDecimal newPercentage = newSpent.multiply(hundred).divide(totalBudget, 2, RoundingMode.HALF_UP);

        // Reset threshold alerts if spending drops below threshold (e.g., after expense reduction or deletion)
        if (newPercentage.compareTo(eighty) < 0) {
            reminderLogRepository.deleteByReminderTypeAndEntityId("BUDGET_ALERT_80", tripId);
        }
        if (newPercentage.compareTo(hundred) < 0) {
            reminderLogRepository.deleteByReminderTypeAndEntityId("BUDGET_ALERT_100", tripId);
        }

        // Check 80% threshold crossing
        if (newPercentage.compareTo(eighty) >= 0) {
            boolean alreadySent80 = reminderLogRepository.existsByReminderTypeAndEntityId("BUDGET_ALERT_80", tripId);
            if (!alreadySent80) {
                String msg80 = "Your trip budget has reached 80% of the allocated amount.";
                notifyParticipants(trip, msg80);
                reminderLogRepository.save(ReminderLog.builder()
                        .reminderType("BUDGET_ALERT_80")
                        .entityId(tripId)
                        .userId(0L) // Trip-level alert marker
                        .reminderKey("80_PERCENT")
                        .sentAt(LocalDateTime.now())
                        .build());
            }
        }

        // Check 100% threshold crossing
        if (newPercentage.compareTo(hundred) >= 0) {
            boolean alreadySent100 = reminderLogRepository.existsByReminderTypeAndEntityId("BUDGET_ALERT_100", tripId);
            if (!alreadySent100) {
                String msg100 = "Your trip budget has reached 100% of the allocated amount.";
                notifyParticipants(trip, msg100);
                reminderLogRepository.save(ReminderLog.builder()
                        .reminderType("BUDGET_ALERT_100")
                        .entityId(tripId)
                        .userId(0L) // Trip-level alert marker
                        .reminderKey("100_PERCENT")
                        .sentAt(LocalDateTime.now())
                        .build());
            }
        }
    }

    private void notifyParticipants(Trip trip, String message) {
        Set<User> participants = new LinkedHashSet<>();
        if (trip.getUser() != null) {
            participants.add(trip.getUser());
        }

        List<TripMembership> memberships = tripMembershipRepository.findByTripIdWithUser(trip.getId());
        for (TripMembership tm : memberships) {
            if (tm.getUser() != null) {
                participants.add(tm.getUser());
            }
        }

        for (User user : participants) {
            notificationService.createNotification(user, NotificationType.BUDGET_ALERT, message, false);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoryExpenseSummaryDTO> getCategorySummary(Long tripId, String userEmail) {
        User currentUser = getUser(userEmail);
        Trip trip = getTrip(tripId);
        tripAccessService.validateTripAccess(currentUser, trip);

        List<CategoryExpenseSummaryDTO> summaries = expenseRepository.getCategorySummaryByTripId(tripId);
        BigDecimal totalSpent = expenseRepository.getTotalSpentByTripId(tripId);

        if (totalSpent != null && totalSpent.compareTo(BigDecimal.ZERO) > 0) {
            for (CategoryExpenseSummaryDTO s : summaries) {
                if (s.getTotalAmount() != null) {
                    double pct = s.getTotalAmount().divide(totalSpent, 4, RoundingMode.HALF_UP).doubleValue() * 100.0;
                    s.setPercentage(Math.round(pct * 10.0) / 10.0);
                }
            }
        }
        return summaries;
    }

    @Override
    @Transactional(readOnly = true)
    public BudgetExpenseSummaryDTO getBudgetExpenseSummary(Long tripId, String userEmail) {
        User currentUser = getUser(userEmail);
        Trip trip = getTrip(tripId);
        tripAccessService.validateTripAccess(currentUser, trip);

        Optional<Budget> budgetOpt = budgetRepository.findByTripId(tripId);
        BigDecimal totalBudget = BigDecimal.ZERO;
        String currency = "USD";

        if (budgetOpt.isPresent()) {
            totalBudget = budgetOpt.get().getTotalBudget();
            currency = budgetOpt.get().getCurrency();
        } else if (trip.getBudget() != null && trip.getBudget() > 0) {
            totalBudget = BigDecimal.valueOf(trip.getBudget());
        }

        BigDecimal totalExpenses = expenseRepository.getTotalSpentByTripId(tripId);
        if (totalExpenses == null) {
            totalExpenses = BigDecimal.ZERO;
        }

        BigDecimal remainingBudget = totalBudget.subtract(totalExpenses);
        boolean isOverBudget = remainingBudget.compareTo(BigDecimal.ZERO) < 0;

        double percentageUsed = 0.0;
        if (totalBudget.compareTo(BigDecimal.ZERO) > 0) {
            percentageUsed = totalExpenses.divide(totalBudget, 4, RoundingMode.HALF_UP).doubleValue() * 100.0;
            percentageUsed = Math.round(percentageUsed * 10.0) / 10.0;
        }

        List<CategoryExpenseSummaryDTO> categorySummaries = getCategorySummary(tripId, userEmail);
        long count = expenseRepository.countByTripId(tripId);

        return BudgetExpenseSummaryDTO.builder()
                .tripId(trip.getId())
                .tripTitle(trip.getTitle())
                .totalBudget(totalBudget)
                .currency(currency)
                .totalExpenses(totalExpenses)
                .remainingBudget(remainingBudget)
                .percentageUsed(percentageUsed)
                .isOverBudget(isOverBudget)
                .expenseCount((int) count)
                .categorySummaries(categorySummaries)
                .build();
    }

    private void validateExpenseAmount(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Expense amount must be a positive decimal number greater than zero.");
        }
    }

    private ExpenseCategory parseCategory(String categoryStr) {
        if (categoryStr == null || categoryStr.isBlank()) {
            throw new BadRequestException("Category is required.");
        }
        try {
            return ExpenseCategory.fromString(categoryStr);
        } catch (Exception e) {
            throw new BadRequestException("Invalid category: " + categoryStr + ". Allowed categories: Transportation, Hotel, Food, Shopping, Entertainment, Miscellaneous");
        }
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    private Trip getTrip(Long tripId) {
        return tripRepository.findByIdWithDetails(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Trip not found with id: " + tripId));
    }

    private ExpenseResponseDTO mapToDTO(Expense expense) {
        if (expense == null) return null;

        return ExpenseResponseDTO.builder()
                .id(expense.getId())
                .tripId(expense.getTrip() != null ? expense.getTrip().getId() : null)
                .tripTitle(expense.getTrip() != null ? expense.getTrip().getTitle() : null)
                .title(expense.getTitle())
                .description(expense.getDescription())
                .category(expense.getCategory() != null ? expense.getCategory().getDisplayName() : null)
                .amount(expense.getAmount())
                .budgetId(expense.getBudget() != null ? expense.getBudget().getId() : null)
                .expenseDate(expense.getExpenseDate())
                .receiptUrl(expense.getReceiptUrl())
                .payerId(expense.getPayer() != null ? expense.getPayer().getId() : null)
                .payerName(expense.getPayer() != null ? expense.getPayer().getFullName() : null)
                .payerEmail(expense.getPayer() != null ? expense.getPayer().getEmail() : null)
                .createdAt(expense.getCreatedAt())
                .updatedAt(expense.getUpdatedAt())
                .build();
    }
}
