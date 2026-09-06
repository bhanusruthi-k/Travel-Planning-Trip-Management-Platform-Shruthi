package com.tripnest.tripnest_backend.service;

import com.tripnest.tripnest_backend.dto.expense.BudgetExpenseSummaryDTO;
import com.tripnest.tripnest_backend.dto.expense.CategoryExpenseSummaryDTO;
import com.tripnest.tripnest_backend.dto.expense.ExpenseRequestDTO;
import com.tripnest.tripnest_backend.dto.expense.ExpenseResponseDTO;

import java.util.List;

public interface ExpenseService {

    ExpenseResponseDTO createExpense(Long tripId, ExpenseRequestDTO dto, String userEmail);

    List<ExpenseResponseDTO> getExpensesByTripId(Long tripId, String userEmail);

    ExpenseResponseDTO getExpenseById(Long tripId, Long expenseId, String userEmail);

    ExpenseResponseDTO updateExpense(Long tripId, Long expenseId, ExpenseRequestDTO dto, String userEmail);

    void deleteExpense(Long tripId, Long expenseId, String userEmail);

    List<CategoryExpenseSummaryDTO> getCategorySummary(Long tripId, String userEmail);

    BudgetExpenseSummaryDTO getBudgetExpenseSummary(Long tripId, String userEmail);
}
