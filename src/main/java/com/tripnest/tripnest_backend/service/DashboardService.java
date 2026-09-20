package com.tripnest.tripnest_backend.service;

import com.tripnest.tripnest_backend.dto.dashboard.AdminDashboardResponseDTO;
import com.tripnest.tripnest_backend.dto.dashboard.TravelerDashboardResponseDTO;
import com.tripnest.tripnest_backend.dto.expense.ExpenseResponseDTO;

import java.util.List;

public interface DashboardService {

    TravelerDashboardResponseDTO getTravelerDashboard(String userEmail);

    AdminDashboardResponseDTO getAdminDashboard();

    List<ExpenseResponseDTO> getAdminExpenses();
}
