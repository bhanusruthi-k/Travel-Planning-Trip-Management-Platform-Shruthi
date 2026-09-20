package com.tripnest.tripnest_backend.service;

import com.tripnest.tripnest_backend.dto.auth.UserDTO;
import com.tripnest.tripnest_backend.dto.user.ChangePasswordRequest;
import com.tripnest.tripnest_backend.dto.user.UpdateProfileRequest;

import java.util.List;

public interface UserService {

    UserDTO getProfile(String email);

    UserDTO updateProfile(String email, UpdateProfileRequest request);

    UserDTO updateProfilePhoto(String email, String photoDataOrUrl);

    void changePassword(String email, ChangePasswordRequest request);

    void deleteAccount(String email);

    List<UserDTO> getTravelers();

    long getTravelerCount();
}
