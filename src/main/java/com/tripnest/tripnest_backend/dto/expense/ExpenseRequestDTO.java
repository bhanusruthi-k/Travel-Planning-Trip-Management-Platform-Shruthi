package com.tripnest.tripnest_backend.dto.expense;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseRequestDTO {

    @NotBlank(message = "Expense title is required")
    private String title;

    private String description;

    @NotBlank(message = "Expense category is required")
    private String category;

    @NotNull(message = "Expense amount is required")
    @DecimalMin(value = "0.01", inclusive = true, message = "Expense amount must be greater than zero")
    private BigDecimal amount;

    @NotNull(message = "Expense date is required")
    private LocalDate expenseDate;

    private String receiptUrl;

    private Long payerId;
}
