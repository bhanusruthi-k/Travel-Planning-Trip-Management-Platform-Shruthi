package com.tripnest.tripnest_backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "budgets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Budget {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "total_budget", precision = 12, scale = 2, nullable = false)
    private BigDecimal totalBudget;

    @Column(name = "currency", length = 10, nullable = false)
    @Builder.Default
    private String currency = "USD";

    @Column(length = 50)
    private String category;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "accommodation_budget", precision = 12, scale = 2)
    private BigDecimal accommodationBudget;

    @Column(name = "food_budget", precision = 12, scale = 2)
    private BigDecimal foodBudget;

    @Column(name = "transportation_budget", precision = 12, scale = 2)
    private BigDecimal transportationBudget;

    @Column(name = "activities_budget", precision = 12, scale = 2)
    private BigDecimal activitiesBudget;

    @Column(name = "emergency_budget", precision = 12, scale = 2)
    private BigDecimal emergencyBudget;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id", nullable = false, unique = true)
    private Trip trip;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.currency == null || this.currency.isBlank()) {
            this.currency = "USD";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
