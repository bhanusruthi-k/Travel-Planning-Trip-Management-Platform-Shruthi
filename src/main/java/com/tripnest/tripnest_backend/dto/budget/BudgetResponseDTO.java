package com.tripnest.tripnest_backend.dto.budget;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BudgetResponseDTO {

    private Long id;
    private Long tripId;
    private String tripTitle;
    private BigDecimal totalBudget;
    private String currency;
    private String category;
    private String notes;
    private BigDecimal accommodationBudget;
    private BigDecimal foodBudget;
    private BigDecimal transportationBudget;
    private BigDecimal activitiesBudget;
    private BigDecimal emergencyBudget;
    private BigDecimal totalAllocated;
    private BigDecimal remainingUnallocated;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
