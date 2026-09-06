package com.tripnest.tripnest_backend.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum ExpenseCategory {
    TRANSPORTATION("Transportation"),
    HOTEL("Hotel"),
    FOOD("Food"),
    SHOPPING("Shopping"),
    ENTERTAINMENT("Entertainment"),
    MISCELLANEOUS("Miscellaneous");

    private final String displayName;

    ExpenseCategory(String displayName) {
        this.displayName = displayName;
    }

    @JsonValue
    public String getDisplayName() {
        return displayName;
    }

    @JsonCreator
    public static ExpenseCategory fromString(String text) {
        if (text == null || text.isBlank()) {
            return MISCELLANEOUS;
        }
        for (ExpenseCategory b : ExpenseCategory.values()) {
            if (b.displayName.equalsIgnoreCase(text.trim()) || b.name().equalsIgnoreCase(text.trim())) {
                return b;
            }
        }
        return MISCELLANEOUS;
    }
}
