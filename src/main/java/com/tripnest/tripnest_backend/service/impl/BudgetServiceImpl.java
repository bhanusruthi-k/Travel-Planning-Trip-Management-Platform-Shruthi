package com.tripnest.tripnest_backend.service.impl;

import com.tripnest.tripnest_backend.dto.budget.BudgetRequestDTO;
import com.tripnest.tripnest_backend.dto.budget.BudgetResponseDTO;
import com.tripnest.tripnest_backend.exception.BadRequestException;
import com.tripnest.tripnest_backend.exception.ForbiddenException;
import com.tripnest.tripnest_backend.exception.ResourceNotFoundException;
import com.tripnest.tripnest_backend.model.Budget;
import com.tripnest.tripnest_backend.model.Role;
import com.tripnest.tripnest_backend.model.Trip;
import com.tripnest.tripnest_backend.model.User;
import com.tripnest.tripnest_backend.repository.BudgetRepository;
import com.tripnest.tripnest_backend.repository.TripRepository;
import com.tripnest.tripnest_backend.repository.UserRepository;
import com.tripnest.tripnest_backend.service.BudgetService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class BudgetServiceImpl implements BudgetService {

    private final BudgetRepository budgetRepository;
    private final TripRepository tripRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public BudgetResponseDTO createBudget(Long tripId, BudgetRequestDTO dto, String userEmail) {
        User user = getUser(userEmail);
        Trip trip = tripRepository.findByIdWithDetails(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Trip not found with id: " + tripId));
        validateOwnership(trip, user);

        if (budgetRepository.existsByTripId(tripId)) {
            throw new BadRequestException("A budget already exists for this trip. Please update the existing budget instead.");
        }

        validateBudgetBreakdown(dto);

        Budget budget = Budget.builder()
                .totalBudget(dto.getTotalBudget())
                .currency(dto.getCurrency() != null && !dto.getCurrency().isBlank() ? dto.getCurrency().toUpperCase().trim() : "USD")
                .category(dto.getCategory())
                .notes(dto.getNotes())
                .accommodationBudget(dto.getAccommodationBudget())
                .foodBudget(dto.getFoodBudget())
                .transportationBudget(dto.getTransportationBudget())
                .activitiesBudget(dto.getActivitiesBudget())
                .emergencyBudget(dto.getEmergencyBudget())
                .trip(trip)
                .build();

        Budget saved = budgetRepository.save(budget);

        // Keep trip budget number in sync
        trip.setBudget(dto.getTotalBudget().doubleValue());
        tripRepository.save(trip);

        return mapToDTO(saved);
    }

    @Override
    @Transactional
    public BudgetResponseDTO updateBudget(Long tripId, BudgetRequestDTO dto, String userEmail) {
        User user = getUser(userEmail);
        Trip trip = tripRepository.findByIdWithDetails(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Trip not found with id: " + tripId));
        validateOwnership(trip, user);

        Budget budget = budgetRepository.findByTripId(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Budget not found for trip id: " + tripId));

        validateBudgetBreakdown(dto);

        budget.setTotalBudget(dto.getTotalBudget());
        if (dto.getCurrency() != null && !dto.getCurrency().isBlank()) {
            budget.setCurrency(dto.getCurrency().toUpperCase().trim());
        }
        if (dto.getCategory() != null) {
            budget.setCategory(dto.getCategory());
        }
        if (dto.getNotes() != null) {
            budget.setNotes(dto.getNotes());
        }
        budget.setAccommodationBudget(dto.getAccommodationBudget());
        budget.setFoodBudget(dto.getFoodBudget());
        budget.setTransportationBudget(dto.getTransportationBudget());
        budget.setActivitiesBudget(dto.getActivitiesBudget());
        budget.setEmergencyBudget(dto.getEmergencyBudget());

        Budget updated = budgetRepository.save(budget);

        // Keep trip budget number in sync
        trip.setBudget(dto.getTotalBudget().doubleValue());
        tripRepository.save(trip);

        return mapToDTO(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public BudgetResponseDTO getBudgetByTripId(Long tripId, String userEmail) {
        User user = getUser(userEmail);
        Trip trip = tripRepository.findByIdWithDetails(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Trip not found with id: " + tripId));
        validateOwnership(trip, user);

        Budget budget = budgetRepository.findByTripId(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("No budget found for trip id: " + tripId));

        return mapToDTO(budget);
    }

    @Override
    @Transactional
    public void deleteBudget(Long tripId, String userEmail) {
        User user = getUser(userEmail);
        Trip trip = tripRepository.findByIdWithDetails(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Trip not found with id: " + tripId));
        validateOwnership(trip, user);

        Budget budget = budgetRepository.findByTripId(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Budget not found for trip id: " + tripId));

        budgetRepository.delete(budget);
    }

    private void validateBudgetBreakdown(BudgetRequestDTO dto) {
        if (dto.getTotalBudget() == null || dto.getTotalBudget().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Total budget must be a positive value.");
        }

        BigDecimal sum = BigDecimal.ZERO;
        if (dto.getAccommodationBudget() != null) sum = sum.add(dto.getAccommodationBudget());
        if (dto.getFoodBudget() != null) sum = sum.add(dto.getFoodBudget());
        if (dto.getTransportationBudget() != null) sum = sum.add(dto.getTransportationBudget());
        if (dto.getActivitiesBudget() != null) sum = sum.add(dto.getActivitiesBudget());
        if (dto.getEmergencyBudget() != null) sum = sum.add(dto.getEmergencyBudget());

        if (sum.compareTo(dto.getTotalBudget()) > 0) {
            throw new BadRequestException(
                    String.format("Sum of allocated category budgets (%s) exceeds total budget (%s).", sum, dto.getTotalBudget())
            );
        }
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    private void validateOwnership(Trip trip, User user) {
        if (user.getRole() == Role.ADMINISTRATOR) {
            return;
        }
        if (!trip.getUser().getId().equals(user.getId())) {
            throw new ForbiddenException("You do not have permission to access or modify this trip's budget.");
        }
    }

    private BudgetResponseDTO mapToDTO(Budget budget) {
        if (budget == null) return null;

        BigDecimal allocated = BigDecimal.ZERO;
        if (budget.getAccommodationBudget() != null) allocated = allocated.add(budget.getAccommodationBudget());
        if (budget.getFoodBudget() != null) allocated = allocated.add(budget.getFoodBudget());
        if (budget.getTransportationBudget() != null) allocated = allocated.add(budget.getTransportationBudget());
        if (budget.getActivitiesBudget() != null) allocated = allocated.add(budget.getActivitiesBudget());
        if (budget.getEmergencyBudget() != null) allocated = allocated.add(budget.getEmergencyBudget());

        BigDecimal remaining = budget.getTotalBudget() != null ? budget.getTotalBudget().subtract(allocated) : BigDecimal.ZERO;
        if (remaining.compareTo(BigDecimal.ZERO) < 0) {
            remaining = BigDecimal.ZERO;
        }

        return BudgetResponseDTO.builder()
                .id(budget.getId())
                .tripId(budget.getTrip() != null ? budget.getTrip().getId() : null)
                .tripTitle(budget.getTrip() != null ? budget.getTrip().getTitle() : null)
                .totalBudget(budget.getTotalBudget())
                .currency(budget.getCurrency() != null ? budget.getCurrency() : "USD")
                .category(budget.getCategory())
                .notes(budget.getNotes())
                .accommodationBudget(budget.getAccommodationBudget())
                .foodBudget(budget.getFoodBudget())
                .transportationBudget(budget.getTransportationBudget())
                .activitiesBudget(budget.getActivitiesBudget())
                .emergencyBudget(budget.getEmergencyBudget())
                .totalAllocated(allocated)
                .remainingUnallocated(remaining)
                .createdAt(budget.getCreatedAt())
                .updatedAt(budget.getUpdatedAt())
                .build();
    }
}
