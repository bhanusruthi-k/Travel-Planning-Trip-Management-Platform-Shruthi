package com.tripnest.tripnest_backend.service.impl;

import com.tripnest.tripnest_backend.dto.auth.AuthResponse;
import com.tripnest.tripnest_backend.dto.auth.LoginRequest;
import com.tripnest.tripnest_backend.dto.auth.RegisterRequest;
import com.tripnest.tripnest_backend.dto.auth.UserDTO;
import com.tripnest.tripnest_backend.exception.BadRequestException;
import com.tripnest.tripnest_backend.exception.ResourceNotFoundException;
import com.tripnest.tripnest_backend.model.*;
import com.tripnest.tripnest_backend.repository.*;
import com.tripnest.tripnest_backend.security.JwtTokenProvider;
import com.tripnest.tripnest_backend.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final AuthenticationManager authenticationManager;
    private final TripRepository tripRepository;
    private final TripMembershipRepository tripMembershipRepository;
    private final JoinRequestRepository joinRequestRepository;
    private final NotificationRepository notificationRepository;
    private final ExpenseRepository expenseRepository;
    private final BudgetRepository budgetRepository;
    private final ItineraryDayRepository itineraryDayRepository;
    private final ReminderLogRepository reminderLogRepository;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        return registerWithRole(request, Role.TRAVELER);
    }

    @Override
    @Transactional
    public AuthResponse registerAdmin(RegisterRequest request) {
        return registerWithRole(request, Role.ADMINISTRATOR);
    }

    private AuthResponse registerWithRole(RegisterRequest request, Role role) {
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new BadRequestException("Email is required");
        }
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new BadRequestException("Password is required");
        }
        if (request.getFullName() == null || request.getFullName().isBlank()) {
            throw new BadRequestException("Full name is required");
        }

        String cleanEmail = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(cleanEmail)) {
            throw new BadRequestException("An account with this email already exists: " + cleanEmail);
        }

        User user = User.builder()
                .email(cleanEmail)
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName().trim())
                .role(role)
                .build();

        User savedUser = userRepository.save(user);
        String token = tokenProvider.generateToken(savedUser.getEmail(), savedUser.getRole());

        log.info("Successfully registered user: {} with role: {}", cleanEmail, role);

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .user(mapToUserDTO(savedUser))
                .build();
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        if (request.getEmail() == null || request.getEmail().isBlank() ||
            request.getPassword() == null || request.getPassword().isBlank()) {
            throw new BadCredentialsException("Invalid email or password");
        }

        String cleanEmail = request.getEmail().trim().toLowerCase();

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(cleanEmail, request.getPassword())
            );
        } catch (BadCredentialsException e) {
            log.warn("Failed authentication attempt for email: {}", cleanEmail);
            throw new BadCredentialsException("Invalid email or password");
        }

        User user = userRepository.findByEmail(cleanEmail)
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        String token = tokenProvider.generateToken(user.getEmail(), user.getRole());

        log.info("User logged in successfully: {} with role: {}", cleanEmail, user.getRole());

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .user(mapToUserDTO(user))
                .build();
    }

    @Override
    public UserDTO getCurrentUser(String email) {
        String cleanEmail = email != null ? email.trim().toLowerCase() : "";
        User user = userRepository.findByEmail(cleanEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        return mapToUserDTO(user);
    }

    @Override
    @Transactional
    public void deleteAccount(String email) {
        if (email == null || email.isBlank()) {
            throw new BadRequestException("User email is required");
        }
        String cleanEmail = email.trim().toLowerCase();
        User user = userRepository.findByEmail(cleanEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        Long userId = user.getId();

        // 1. Delete all notifications for this user
        List<Notification> notifications = notificationRepository.findByUserIdOrderByIdDesc(userId);
        if (notifications != null && !notifications.isEmpty()) {
            notificationRepository.deleteAll(notifications);
        }

        // 2. Delete join requests created by user
        List<JoinRequest> userJoinRequests = joinRequestRepository.findByUserId(userId);
        if (userJoinRequests != null && !userJoinRequests.isEmpty()) {
            joinRequestRepository.deleteAll(userJoinRequests);
        }

        // 3. Delete trip memberships where user is a participant
        List<TripMembership> memberships = tripMembershipRepository.findByUserId(userId);
        if (memberships != null && !memberships.isEmpty()) {
            tripMembershipRepository.deleteAll(memberships);
        }

        // 4. Delete trips created by the user and all their child entities
        List<Trip> userTrips = tripRepository.findByUserId(userId);
        if (userTrips != null && !userTrips.isEmpty()) {
            for (Trip trip : userTrips) {
                joinRequestRepository.deleteByTripId(trip.getId());
                tripMembershipRepository.deleteByTripId(trip.getId());

                List<Expense> tripExpenses = expenseRepository.findByTripIdOrderByExpenseDateDesc(trip.getId());
                if (tripExpenses != null && !tripExpenses.isEmpty()) {
                    expenseRepository.deleteAll(tripExpenses);
                }

                budgetRepository.deleteByTripId(trip.getId());

                List<ItineraryDay> days = itineraryDayRepository.findByTripIdOrderByDayNumberAsc(trip.getId());
                if (days != null && !days.isEmpty()) {
                    itineraryDayRepository.deleteAll(days);
                }

                tripRepository.delete(trip);
            }
        }

        // 5. Delete reminder logs for this user
        reminderLogRepository.deleteByUserId(userId);

        // 6. Delete user entity
        userRepository.delete(user);

        log.info("Successfully deleted user account: {} (id: {})", cleanEmail, userId);
    }

    private UserDTO mapToUserDTO(User user) {
        return UserDTO.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phoneNumber(user.getPhoneNumber())
                .dateOfBirth(user.getDateOfBirth())
                .gender(user.getGender())
                .country(user.getCountry())
                .city(user.getCity())
                .bio(user.getBio())
                .profilePhoto(user.getProfilePhoto())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .build();
    }
}


