package com.tripnest.tripnest_backend.service;

import com.tripnest.tripnest_backend.dto.budget.BudgetRequestDTO;
import com.tripnest.tripnest_backend.dto.budget.BudgetResponseDTO;

public interface BudgetService {

    BudgetResponseDTO createBudget(Long tripId, BudgetRequestDTO dto, String userEmail);

    BudgetResponseDTO updateBudget(Long tripId, BudgetRequestDTO dto, String userEmail);

    BudgetResponseDTO getBudgetByTripId(Long tripId, String userEmail);

    void deleteBudget(Long tripId, String userEmail);
}
