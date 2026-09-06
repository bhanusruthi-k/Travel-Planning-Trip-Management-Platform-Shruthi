package com.tripnest.tripnest_backend.dto.budget;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BudgetRequestDTO {

    @NotNull(message = "Total budget is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Total budget must be greater than zero")
    private BigDecimal totalBudget;

    @NotBlank(message = "Currency is required")
    private String currency;

    private String category;

    private String notes;

    @DecimalMin(value = "0.0", inclusive = true, message = "Accommodation budget must be non-negative")
    private BigDecimal accommodationBudget;

    @DecimalMin(value = "0.0", inclusive = true, message = "Food budget must be non-negative")
    private BigDecimal foodBudget;

    @DecimalMin(value = "0.0", inclusive = true, message = "Transportation budget must be non-negative")
    private BigDecimal transportationBudget;

    @DecimalMin(value = "0.0", inclusive = true, message = "Activities budget must be non-negative")
    private BigDecimal activitiesBudget;

    @DecimalMin(value = "0.0", inclusive = true, message = "Emergency budget must be non-negative")
    private BigDecimal emergencyBudget;
}
