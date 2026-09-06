package com.tripnest.tripnest_backend.dto.expense;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BudgetExpenseSummaryDTO {

    private Long tripId;
    private String tripTitle;
    private BigDecimal totalBudget;
    private String currency;
    private BigDecimal totalExpenses;
    private BigDecimal remainingBudget;
    private Double percentageUsed;
    private Boolean isOverBudget;
    private Integer expenseCount;
    private List<CategoryExpenseSummaryDTO> categorySummaries;
}
