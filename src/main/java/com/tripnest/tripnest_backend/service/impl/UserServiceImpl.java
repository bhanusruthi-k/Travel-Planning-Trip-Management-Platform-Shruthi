package com.tripnest.tripnest_backend.service.impl;

import com.tripnest.tripnest_backend.dto.auth.UserDTO;
import com.tripnest.tripnest_backend.dto.user.ChangePasswordRequest;
import com.tripnest.tripnest_backend.dto.user.UpdateProfileRequest;
import com.tripnest.tripnest_backend.exception.BadRequestException;
import com.tripnest.tripnest_backend.exception.ResourceNotFoundException;
import com.tripnest.tripnest_backend.model.User;
import com.tripnest.tripnest_backend.repository.UserRepository;
import com.tripnest.tripnest_backend.service.AuthService;
import com.tripnest.tripnest_backend.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;

    @Override
    @Transactional(readOnly = true)
    public UserDTO getProfile(String email) {
        String cleanEmail = cleanEmail(email);
        User user = userRepository.findByEmail(cleanEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        return mapToUserDTO(user);
    }

    @Override
    @Transactional
    public UserDTO updateProfile(String email, UpdateProfileRequest request) {
        String cleanEmail = cleanEmail(email);
        User user = userRepository.findByEmail(cleanEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        if (request.getFullName() != null) {
            String trimmedName = request.getFullName().trim();
            if (trimmedName.isEmpty()) {
                throw new BadRequestException("Full name cannot be blank.");
            }
            user.setFullName(trimmedName);
        }

        if (request.getPhoneNumber() != null) {
            user.setPhoneNumber(request.getPhoneNumber().trim());
        }

        if (request.getDateOfBirth() != null) {
            user.setDateOfBirth(request.getDateOfBirth().trim());
        }

        if (request.getGender() != null) {
            user.setGender(request.getGender().trim());
        }

        if (request.getCountry() != null) {
            user.setCountry(request.getCountry().trim());
        }

        if (request.getCity() != null) {
            user.setCity(request.getCity().trim());
        }

        if (request.getBio() != null) {
            user.setBio(request.getBio().trim());
        }

        User updatedUser = userRepository.save(user);
        log.info("Profile updated successfully for user: {}", cleanEmail);
        return mapToUserDTO(updatedUser);
    }

    @Override
    @Transactional
    public UserDTO updateProfilePhoto(String email, String photoDataOrUrl) {
        String cleanEmail = cleanEmail(email);
        User user = userRepository.findByEmail(cleanEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        if (photoDataOrUrl == null || photoDataOrUrl.trim().isEmpty()) {
            throw new BadRequestException("Profile photo data cannot be empty.");
        }

        user.setProfilePhoto(photoDataOrUrl.trim());
        User updatedUser = userRepository.save(user);
        log.info("Profile photo updated successfully for user: {}", cleanEmail);
        return mapToUserDTO(updatedUser);
    }

    @Override
    @Transactional
    public void changePassword(String email, ChangePasswordRequest request) {
        String cleanEmail = cleanEmail(email);
        User user = userRepository.findByEmail(cleanEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("Current password is incorrect.");
        }

        if (request.getNewPassword() == null || request.getNewPassword().length() < 6) {
            throw new BadRequestException("New password must be at least 6 characters.");
        }

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("New password and confirm password do not match.");
        }

        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new BadRequestException("New password cannot be the same as the current password.");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        log.info("Password changed successfully for user: {}", cleanEmail);
    }

    @Override
    @Transactional
    public void deleteAccount(String email) {
        String cleanEmail = cleanEmail(email);
        authService.deleteAccount(cleanEmail);
    }


    private String cleanEmail(String email) {
        return email != null ? email.trim().toLowerCase() : "";
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
