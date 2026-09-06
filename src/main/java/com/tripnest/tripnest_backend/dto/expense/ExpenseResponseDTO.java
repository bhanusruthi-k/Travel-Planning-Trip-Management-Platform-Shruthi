package com.tripnest.tripnest_backend.dto.expense;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseResponseDTO {

    private Long id;
    private Long tripId;
    private String tripTitle;
    private Long budgetId;
    private Long payerId;
    private String payerName;
    private String payerEmail;
    private String title;
    private String description;
    private String category;
    private BigDecimal amount;
    private LocalDate expenseDate;
    private String receiptUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
