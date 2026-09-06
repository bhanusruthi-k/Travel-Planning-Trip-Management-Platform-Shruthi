package com.tripnest.tripnest_backend.service;

import com.tripnest.tripnest_backend.dto.dashboard.AdminDashboardResponseDTO;
import com.tripnest.tripnest_backend.dto.dashboard.TravelerDashboardResponseDTO;

public interface DashboardService {

    TravelerDashboardResponseDTO getTravelerDashboard(String userEmail);

    AdminDashboardResponseDTO getAdminDashboard();
}
