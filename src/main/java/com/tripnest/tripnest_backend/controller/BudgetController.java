package com.tripnest.tripnest_backend.controller;

import com.tripnest.tripnest_backend.dto.budget.BudgetRequestDTO;
import com.tripnest.tripnest_backend.dto.budget.BudgetResponseDTO;
import com.tripnest.tripnest_backend.service.BudgetService;
import com.tripnest.tripnest_backend.service.ExpenseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/trips/{tripId}/budget")
@RequiredArgsConstructor
public class BudgetController {

    private final BudgetService budgetService;
    private final ExpenseService expenseService;

    @PostMapping
    public ResponseEntity<BudgetResponseDTO> createBudget(@PathVariable Long tripId,
                                                          @Valid @RequestBody BudgetRequestDTO dto,
                                                          Authentication authentication) {
        BudgetResponseDTO response = budgetService.createBudget(tripId, dto, authentication.getName());
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PutMapping
    public ResponseEntity<BudgetResponseDTO> updateBudget(@PathVariable Long tripId,
                                                          @Valid @RequestBody BudgetRequestDTO dto,
                                                          Authentication authentication) {
        BudgetResponseDTO response = budgetService.updateBudget(tripId, dto, authentication.getName());
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<BudgetResponseDTO> getBudget(@PathVariable Long tripId,
                                                       Authentication authentication) {
        BudgetResponseDTO response = budgetService.getBudgetByTripId(tripId, authentication.getName());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/remaining")
    public ResponseEntity<com.tripnest.tripnest_backend.dto.expense.BudgetExpenseSummaryDTO> getRemainingBudget(
            @PathVariable Long tripId,
            Authentication authentication) {
        return ResponseEntity.ok(expenseService.getBudgetExpenseSummary(tripId, authentication.getName()));
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteBudget(@PathVariable Long tripId,
                                             Authentication authentication) {
        budgetService.deleteBudget(tripId, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
