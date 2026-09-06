package com.tripnest.tripnest_backend.controller;

import com.tripnest.tripnest_backend.dto.expense.BudgetExpenseSummaryDTO;
import com.tripnest.tripnest_backend.dto.expense.CategoryExpenseSummaryDTO;
import com.tripnest.tripnest_backend.dto.expense.ExpenseRequestDTO;
import com.tripnest.tripnest_backend.dto.expense.ExpenseResponseDTO;
import com.tripnest.tripnest_backend.service.ExpenseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/trips/{tripId}/expenses")
@RequiredArgsConstructor
public class ExpenseController {

    private final ExpenseService expenseService;

    @PostMapping
    public ResponseEntity<ExpenseResponseDTO> createExpense(@PathVariable Long tripId,
                                                            @Valid @RequestBody ExpenseRequestDTO dto,
                                                            Authentication authentication) {
        ExpenseResponseDTO response = expenseService.createExpense(tripId, dto, authentication.getName());
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<ExpenseResponseDTO>> getExpenses(@PathVariable Long tripId,
                                                               Authentication authentication) {
        List<ExpenseResponseDTO> expenses = expenseService.getExpensesByTripId(tripId, authentication.getName());
        return ResponseEntity.ok(expenses);
    }

    @GetMapping("/{expenseId}")
    public ResponseEntity<ExpenseResponseDTO> getExpenseById(@PathVariable Long tripId,
                                                             @PathVariable Long expenseId,
                                                             Authentication authentication) {
        ExpenseResponseDTO expense = expenseService.getExpenseById(tripId, expenseId, authentication.getName());
        return ResponseEntity.ok(expense);
    }

    @PutMapping("/{expenseId}")
    public ResponseEntity<ExpenseResponseDTO> updateExpense(@PathVariable Long tripId,
                                                            @PathVariable Long expenseId,
                                                            @Valid @RequestBody ExpenseRequestDTO dto,
                                                            Authentication authentication) {
        ExpenseResponseDTO response = expenseService.updateExpense(tripId, expenseId, dto, authentication.getName());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{expenseId}")
    public ResponseEntity<Void> deleteExpense(@PathVariable Long tripId,
                                              @PathVariable Long expenseId,
                                              Authentication authentication) {
        expenseService.deleteExpense(tripId, expenseId, authentication.getName());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/category-summary")
    public ResponseEntity<List<CategoryExpenseSummaryDTO>> getCategorySummary(@PathVariable Long tripId,
                                                                             Authentication authentication) {
        List<CategoryExpenseSummaryDTO> summary = expenseService.getCategorySummary(tripId, authentication.getName());
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/remaining-budget")
    public ResponseEntity<BudgetExpenseSummaryDTO> getRemainingBudget(@PathVariable Long tripId,
                                                                     Authentication authentication) {
        BudgetExpenseSummaryDTO summary = expenseService.getBudgetExpenseSummary(tripId, authentication.getName());
        return ResponseEntity.ok(summary);
    }
}
