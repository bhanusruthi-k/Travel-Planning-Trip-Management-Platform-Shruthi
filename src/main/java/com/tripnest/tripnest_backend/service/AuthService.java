package com.tripnest.tripnest_backend.service;

import com.tripnest.tripnest_backend.dto.auth.AuthResponse;
import com.tripnest.tripnest_backend.dto.auth.LoginRequest;
import com.tripnest.tripnest_backend.dto.auth.RegisterRequest;
import com.tripnest.tripnest_backend.dto.auth.UserDTO;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    UserDTO getCurrentUser(String email);
}
