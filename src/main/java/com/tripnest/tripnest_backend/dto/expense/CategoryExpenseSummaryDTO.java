package com.tripnest.tripnest_backend.dto.expense;

import com.tripnest.tripnest_backend.model.ExpenseCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryExpenseSummaryDTO {

    private String category;
    private BigDecimal totalAmount;
    private Long count;
    private Double percentage;

    public CategoryExpenseSummaryDTO(ExpenseCategory category, BigDecimal totalAmount, Long count) {
        this.category = category != null ? category.getDisplayName() : ExpenseCategory.MISCELLANEOUS.getDisplayName();
        this.totalAmount = totalAmount != null ? totalAmount : BigDecimal.ZERO;
        this.count = count != null ? count : 0L;
        this.percentage = 0.0;
    }
}
